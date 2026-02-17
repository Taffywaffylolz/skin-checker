import { EpicAccessToken, EpicDeviceAuthStart, EpicSession } from "../types.js";

const EPIC_ACCOUNT_BASE =
  process.env.EPIC_ACCOUNT_BASE_URL ??
  "https://account-public-service-prod.ol.epicgames.com";

export class EpicAuthService {
  private readonly sessions = new Map<string, EpicSession>();

  private get basicAuth(): string {
    const creds = process.env.EPIC_OAUTH_BASIC;
    if (!creds) {
      throw new Error("EPIC_OAUTH_BASIC is required (base64(clientId:clientSecret))");
    }

    return creds;
  }

  getSession(discordUserId: string): EpicSession | undefined {
    const session = this.sessions.get(discordUserId);
    if (!session) return undefined;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(discordUserId);
      return undefined;
    }

    return session;
  }

  async startDeviceAuth(): Promise<EpicDeviceAuthStart> {
    const response = await fetch(
      `${EPIC_ACCOUNT_BASE}/account/api/oauth/deviceAuthorization`,
      {
        method: "POST",
        headers: {
          Authorization: `basic ${this.basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          prompt: "login"
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Device auth start failed (${response.status})`);
    }

    const payload = (await response.json()) as {
      device_code: string;
      user_code: string;
      verification_uri: string;
      verification_uri_complete: string;
      expires_in: number;
      interval: number;
    };

    return {
      deviceCode: payload.device_code,
      userCode: payload.user_code,
      verificationUri: payload.verification_uri,
      verificationUriComplete: payload.verification_uri_complete,
      expiresIn: payload.expires_in,
      interval: payload.interval
    };
  }

  async pollDeviceAuth(deviceCode: string): Promise<EpicAccessToken> {
    const response = await fetch(`${EPIC_ACCOUNT_BASE}/account/api/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `basic ${this.basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "device_code",
        device_code: deviceCode,
        token_type: "eg1"
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token poll failed (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      account_id: string;
      displayName?: string;
    };

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresIn: payload.expires_in,
      accountId: payload.account_id,
      displayName: payload.displayName
    };
  }

  saveSession(discordUserId: string, token: EpicAccessToken): EpicSession {
    const session: EpicSession = {
      discordUserId,
      accountId: token.accountId,
      displayName: token.displayName,
      accessToken: token.accessToken,
      expiresAt: Date.now() + token.expiresIn * 1000 - 10_000
    };

    this.sessions.set(discordUserId, session);
    return session;
  }
}
