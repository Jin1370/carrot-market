interface AccessTokenResponse {
    access_token: string;
    error?: string;
}
export async function getAccessToken(code: any): Promise<AccessTokenResponse> {
    const accessTokenParams = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code, //code: code
    }).toString();
    const accessTokenURL = `https://github.com/login/oauth/access_token?${accessTokenParams}`;
    const accessTokenResponse = await fetch(accessTokenURL, {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
    });
    return await accessTokenResponse.json();
}

interface GitHubProfileResponse {
    id: number;
    login: string;
    avatar_url: string;
}
export async function getUserProfile(
    access_token: string
): Promise<GitHubProfileResponse> {
    const userProfileResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        cache: "no-cache",
    });
    return await userProfileResponse.json();
}

export async function getUserEmail(access_token: string): Promise<string> {
    const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        cache: "no-cache",
    });
    type EmailInfo = {
        email: string;
        primary: boolean;
        verified: boolean;
        visibility: string | null;
    };
    const emailData: EmailInfo[] = await emailResponse.json();
    return emailData.find((e) => e.primary)?.email || emailData[0].email;
}
