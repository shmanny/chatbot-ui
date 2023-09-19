import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { ApplicationProtocol, ListenerAction } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cert from 'aws-cdk-lib/aws-certificatemanager'
import { Construct } from 'constructs';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    const updatedProps = {
      ...props,
      env: { ...props?.env, region: 'us-east-1', account: process.env.CDK_DEFAULT_ACCOUNT },
    };
    super(scope, id, updatedProps);

    const vpc = new ec2.Vpc(this, 'PgaGptVpc', {
      maxAzs: 3,
    });

    const cluster = new ecs.Cluster(this, 'PgaGptCluster', {
      vpc: vpc,
    });

    const pgaAppSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'PgaGptSecret',
      'pga-gpt-secrets',
    );

    // IAM inline role - the service principal is required
    const taskRole = new iam.Role(this, 'fargate-test-task-role', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });


    // Access individual key-value pairs
    const OKTA_OAUTH2_CLIENT_SECRET = pgaAppSecret
      .secretValueFromJson('OKTA_OAUTH2_CLIENT_SECRET')
      .unsafeUnwrap();
    const OKTA_OAUTH2_CLIENT_ID = pgaAppSecret
      .secretValueFromJson('OKTA_OAUTH2_CLIENT_ID')
      .unsafeUnwrap();
    const OKTA_OAUTH2_ISSUER = pgaAppSecret
      .secretValueFromJson('OKTA_OAUTH2_ISSUER')
      .unsafeUnwrap();
    const SECRET = pgaAppSecret
      .secretValueFromJson('SECRET')
      .unsafeUnwrap();
    const OPENAI_API_KEY = pgaAppSecret
      .secretValueFromJson('OPENAI_API_KEY')
      .unsafeUnwrap();

    const repository = ecr.Repository.fromRepositoryArn(
      this,
      'PgaGptImage',
      'arn:aws:ecr:us-east-1:099448516820:repository/pga-gpt',
    );

    const albLoadBalancer =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        'MyFargateService',
        {
          cluster: cluster, // Required
          cpu: 512, // Default is 256
          desiredCount: 2, // Default is 1
          taskImageOptions: {
            image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
            containerPort: 3000,
            environment: {
              OKTA_OAUTH2_CLIENT_ID,
              OKTA_OAUTH2_CLIENT_SECRET,
              OKTA_OAUTH2_ISSUER,
              SECRET,
              OPENAI_API_KEY,
              NEXTAUTH_URL: 'https://dev.ai.pgahq.com'
            },
            taskRole,
            
          },
          memoryLimitMiB: 3072, // Default is 512
          publicLoadBalancer: true, // Default is false
        },
      );

      albLoadBalancer.targetGroup.configureHealthCheck({
        path: '/api/healthcheck'
      })

      const hostedZone = route53.HostedZone.fromLookup(this, 'PgaHostedDns', {
        domainName: 'dev.ai.pgahq.com', // Replace with your own domain name
      });  

      const httpsCert = new cert.Certificate(this, 'PgaGptHttpsCert', {
        domainName: 'dev.ai.pgahq.com',
        validation: cert.CertificateValidation.fromDns(hostedZone)
      })

      const wwwCert = new cert.Certificate(this, 'PgaGptWwwCert', {
        domainName: 'www.dev.ai.pgahq.com',
        validation: cert.CertificateValidation.fromDns(hostedZone)
      })

      albLoadBalancer.loadBalancer.addListener('SSL', {
        port: 443,
        certificates: [httpsCert, wwwCert],
        protocol: ApplicationProtocol.HTTPS,
        defaultTargetGroups:  [albLoadBalancer.targetGroup]
      })


    new route53.ARecord(this, 'PgaGptAliasRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53_targets.LoadBalancerTarget(albLoadBalancer.loadBalancer),
      ),
    });
  }
}
