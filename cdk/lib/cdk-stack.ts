import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as ecs_patterns,
  aws_iam as iam,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

const props = {
  env: {
    region: 'us-east-1',
    account: '099448516820',
  },
};

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {
    env: {
      region: 'us-east-1',
      account: '099448516820',
    },
  }) {
    super(scope, id, props);

    const taskRole = new iam.Role(this, 'pga-gpt-task-role', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Define a fargate task with the newly created execution and task roles
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'pga-gpt-fargate-task-definition',
      {
        taskRole: taskRole,
        executionRole: taskRole,
      },
    );

    // Import a local docker image and set up logger
    const container = taskDefinition.addContainer(
      'pga-gpt-fargate-task-container',
      {
        image: ecs.ContainerImage.fromRegistry('099448516820.dkr.ecr.us-east-1.amazonaws.com/pga-gpt'),
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'pga-gpt-task-log-prefix',
        }),
      },
    );

    container.addPortMappings({
      containerPort: 3000,
      hostPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    const vpc = new ec2.Vpc(this, 'pga-gpt-task-vpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Create the cluster
    const cluster = new ecs.Cluster(this, 'pga-gpt-task-cluster', { vpc });

    // Create a load-balanced Fargate service and make it public
    new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'MyFargateService',
      {
        cluster: cluster, // Required
        cpu: 512, // Default is 256
        desiredCount: 2, // Default is 1
        taskDefinition: taskDefinition,
        memoryLimitMiB: 2048, // Default is 512
        publicLoadBalancer: true, // Default is false
      },
    );
  }
}
