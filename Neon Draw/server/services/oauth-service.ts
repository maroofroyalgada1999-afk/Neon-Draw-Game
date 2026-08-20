import crypto from 'crypto';

export interface OAuthUserInfo {
  provider: 'GOOGLE' | 'FACEBOOK';
  socialId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified?: boolean;
}

export class OAuthService {
  public static getGoogleAuthUrl(redirectUri: string, state: string): { url: string; isConfigured: boolean } {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return {
        url: '',
        isConfigured: false,
      };
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      isConfigured: true,
    };
  }

  public static getFacebookAuthUrl(redirectUri: string, state: string): { url: string; isConfigured: boolean } {
    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) {
      return {
        url: '',
        isConfigured: false,
      };
    }

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email,public_profile',
      state,
    });

    return {
      url: `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`,
      isConfigured: true,
    };
  }

  public static async exchangeGoogleCode(code: string, redirectUri: string): Promise<OAuthUserInfo> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured on server.');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Google token exchange failed:', errText);
      throw new Error('Failed to exchange authorization code with Google.');
    }

    const tokenData = (await tokenRes.json()) as { access_token: string; id_token?: string };
    const accessToken = tokenData.access_token;

    // Fetch user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      throw new Error('Failed to fetch user profile from Google.');
    }

    const userData = (await userRes.json()) as {
      sub: string;
      name?: string;
      email?: string;
      picture?: string;
      email_verified?: boolean;
    };

    if (!userData.email) {
      throw new Error('Google account did not provide a verified email.');
    }

    return {
      provider: 'GOOGLE',
      socialId: userData.sub,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      avatarUrl: userData.picture,
      emailVerified: Boolean(userData.email_verified),
    };
  }

  public static async exchangeFacebookCode(code: string, redirectUri: string): Promise<OAuthUserInfo> {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error('Facebook OAuth credentials not configured on server.');
    }

    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Facebook token exchange failed:', errText);
      throw new Error('Failed to exchange authorization code with Facebook.');
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const accessToken = tokenData.access_token;

    const userUrl = new URL('https://graph.facebook.com/me');
    userUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
    userUrl.searchParams.set('access_token', accessToken);

    const userRes = await fetch(userUrl.toString());
    if (!userRes.ok) {
      throw new Error('Failed to fetch user profile from Facebook.');
    }

    const userData = (await userRes.json()) as {
      id: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };

    const email = userData.email || `${userData.id}@facebook.user`;
    const avatarUrl = userData.picture?.data?.url;

    return {
      provider: 'FACEBOOK',
      socialId: userData.id,
      email,
      name: userData.name || `Facebook Player ${userData.id.slice(-4)}`,
      avatarUrl,
      emailVerified: Boolean(userData.email),
    };
  }
}
