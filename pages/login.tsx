import { signIn } from 'next-auth/react';

import Image from 'next/image';

import LoginButton from '@/components/Buttons/LoginButton';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';

export default function Unauthorized() {
  return (
    <div className="flex justify-center items-center flex-col space-y-4 w-full min-h-screen">
      <Image
        width="200"
        height="200"
        src="https://res.cloudinary.com/pgahq/image/upload/v1695141459/pga-brand-assets/pgaa-logo-rev.png"
        alt="logo"
        style={{ margin: 20 }}
      />
      <p>Welcome to PGA GPT. Login with your Okta account below.</p>
      <LoginButton handleClick={() => {
        window.location.href = 'https://pgastaff-sandbox.okta.com/oauth2/default/v1/authorize?client_id=0oasyvv8r3Jgvbzjv357&scope=openid email profile&response_type=code&redirect_uri=https://dev.ai.pgahq.com/api/auth/callback/okta&state=LmiLllWV1eYSdYuuZjZ2j8UU_fSzvXD_B0ys9ByRv2E'
      }}>
        <div>Login</div>
      </LoginButton>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (props) => {
  const { req, res } = props;
  const session = await getServerSession(req, res, authOptions)
    if (session) {
      return {
        redirect: { destination: '/', permanent: false }
      }
    }

    return {
      props: {
      }
    }
}