//https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

import { redirect } from "next/navigation";

export async function GET() {
    const baseURL = "https://github.com/login/oauth/authorize";
    const params = {
        client_id: process.env.GITHUB_CLIENT_ID!,
        scope: "read:user, user:email",
        allow_signup: "false",
    };
    const formattedParams = new URLSearchParams(params).toString(); //params 객체를 쿼리스트링 형식으로 변환. ex)client_id=xxxx&scope=read%3Auser%2C+user%3Aemail&allow_signup=true
    const finalUrl = `${baseURL}?${formattedParams}`;
    return redirect(finalUrl);
}
