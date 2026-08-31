import { PrivyClient } from '@privy-io/server-auth';

export const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

/**
 * Verify a Privy auth token and return the parsed claims.
 */
export async function verifyPrivyToken(token: string) {
  try {
    const verifiedClaims = await privy.verifyAuthToken(token);
    return verifiedClaims;
  } catch (error) {
    console.error(`Token verification failed: ${error}`);
    return null;
  }
}
