const requiredEnvVars = ['NEXT_PUBLIC_AGENT_URL'] as const;

type RequiredEnvKey = (typeof requiredEnvVars)[number];

type EnvConfig = Record<RequiredEnvKey, string> & {
  NEXT_PUBLIC_NO_AUTH?: string;
  NEXT_PUBLIC_DEFAULT_AGENT?: string;
};

const env: EnvConfig = {
  NEXT_PUBLIC_AGENT_URL:
    process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8080',
  NEXT_PUBLIC_NO_AUTH: process.env.NEXT_PUBLIC_NO_AUTH,
  NEXT_PUBLIC_DEFAULT_AGENT: process.env.NEXT_PUBLIC_DEFAULT_AGENT,
};

requiredEnvVars.forEach((key) => {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const getEnv = () => env;

export const isNoAuthEnabled = () => env.NEXT_PUBLIC_NO_AUTH === 'true';
