import { api } from './api';

const GOOGLE_PROVIDER_ID = 'google';

export async function signInWithGoogleTokens({ idToken, accessToken, user }) {
  if (!idToken) {
    throw new Error('Missing Google ID token');
  }
  if (!accessToken) {
    throw new Error('Missing Google access token');
  }

  const redirectURIOnProviderDashboard = api.googleCallback();

  const payload = {
    thirdPartyId: GOOGLE_PROVIDER_ID,
    oAuthTokens: {
      id_token: idToken,
      access_token: accessToken,
    },
    redirectURIInfo: {
      redirectURIOnProviderDashboard,
    },
    user,
  };

  return api.thirdPartySignInUp(payload);
}

export default {
  signInWithGoogleTokens,
};
