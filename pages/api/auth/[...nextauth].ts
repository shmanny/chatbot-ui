import NextAuth from 'next-auth'
import Okta from 'next-auth/providers/okta'
import { Config } from 'sst/node/config'

export const authOptions = {
  providers: [
    Okta({
      clientId: process.env.OKTA_OAUTH2_CLIENT_ID || Config.OKTA_OAUTH2_CLIENT_ID as string,
      clientSecret: process.env.OKTA_OAUTH2_CLIENT_SECRET || Config.OKTA_OAUTH2_CLIENT_SECRET as string,
      issuer: process.env.OKTA_OAUTH2_ISSUER || Config.OKTA_OAUTH2_ISSUER as string,
    })
  ],
  secret: process.env.SECRET as string
}

export default NextAuth(authOptions)