import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAmplifyConfigureFn = vi.fn();

vi.mock("aws-amplify", () => ({
  Amplify: { configure: mockAmplifyConfigureFn },
}));

describe("amplify-config.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    delete process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_COGNITO_HOSTED_UI_DOMAIN;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("configureAmplify returns false when env vars are missing", async () => {
    const { configureAmplify } = await import("@/lib/amplify-config");
    expect(configureAmplify()).toBe(false);
  });

  it("configureAmplify returns true when both env vars are set", async () => {
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = "us-east-1_TestPool";
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = "test-client-id";

    vi.resetModules();
    const { configureAmplify } = await import("@/lib/amplify-config");
    expect(configureAmplify()).toBe(true);
  });

  it("omits the OAuth block when Hosted UI env vars are absent", async () => {
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = "us-east-1_TestPool";
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = "test-client-id";

    vi.resetModules();
    const { isHostedUiConfigured } = await import("@/lib/amplify-config");
    expect(isHostedUiConfigured()).toBe(false);

    const call = mockAmplifyConfigureFn.mock.calls.at(-1);
    expect(call).toBeDefined();
    const cognito = call![0]?.Auth?.Cognito;
    expect(cognito).toBeDefined();
    expect(cognito.loginWith).toBeUndefined();
  });

  it("includes the OAuth block when Hosted UI env vars are present", async () => {
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = "us-east-1_TestPool";
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = "test-client-id";
    process.env.NEXT_PUBLIC_COGNITO_HOSTED_UI_DOMAIN =
      "cloudless-auth.auth.us-east-1.amazoncognito.com";
    process.env.NEXT_PUBLIC_SITE_URL = "https://cloudless.gr";

    vi.resetModules();
    const { isHostedUiConfigured } = await import("@/lib/amplify-config");
    expect(isHostedUiConfigured()).toBe(true);

    const call = mockAmplifyConfigureFn.mock.calls.at(-1);
    expect(call).toBeDefined();
    const oauth = call![0]?.Auth?.Cognito?.loginWith?.oauth;
    expect(oauth).toMatchObject({
      domain: "cloudless-auth.auth.us-east-1.amazoncognito.com",
      scopes: ["openid", "email", "profile"],
      redirectSignIn: ["https://cloudless.gr/auth/callback"],
      redirectSignOut: ["https://cloudless.gr/"],
      responseType: "code",
    });
  });
});
