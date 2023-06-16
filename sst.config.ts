import { SSTConfig } from "sst";
import { NextjsSite, Config } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "chatbot-ui",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const OPENAI_API_KEY = new Config.Secret(stack, "OPENAI_API_KEY")
      const SECRET = new Config.Secret(stack, "SECRET")
      const OKTA_OAUTH2_ISSUER = new Config.Secret(stack, "OKTA_OAUTH2_ISSUER")
      const OKTA_OAUTH2_CLIENT_ID = new Config.Secret(stack, "OKTA_OAUTH2_CLIENT_ID")
      const OKTA_OAUTH2_CLIENT_SECRET = new Config.Secret(stack, "OKTA_OAUTH2_CLIENT_SECRET")

      const site = new NextjsSite(stack, "site", {
        bind: [
          OPENAI_API_KEY,
          SECRET,
          OKTA_OAUTH2_CLIENT_ID,
          OKTA_OAUTH2_ISSUER,
          OKTA_OAUTH2_CLIENT_SECRET,
        ],
        customDomain: {
          domainName: 'dev.chatgpt.pgahq.com',
          domainAlias: 'www.dev.chatgpt.pgahq.com'
        },
        environment: {
          NEXTAUTH_URL: 'https://dev.chatgpt.pgahq.com'
        }
      });      

      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
