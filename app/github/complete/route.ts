import db from "@/lib/db";
import getSession, { updateSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
        return new Response(null, {
            status: 400,
        });
    }
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
    const { error, access_token } = await accessTokenResponse.json();
    if (error) {
        return new Response(null, {
            status: 400,
        });
    }
    const userProfileResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        cache: "no-cache",
    });
    const { id, avatar_url, login } = await userProfileResponse.json();
    const user = await db.user.findUnique({
        where: {
            github_id: id + "",
        },
        select: {
            id: true,
        },
    });
    // 이미 깃허브로 가입되어있으면 redirect
    if (user) {
        await updateSession(user.id);
        return redirect("/profile"); //Route Handler(GET, POST 등)는 반드시 Response를 반환해야 함
    }
    // 깃허브로 가입되어 있지 않으면 새로 가입시킴
    const newUser = await db.user.create({
        data: {
            username: login, //이미 있는 사용자 이름이면 문제
            github_id: id + "",
            avatar: avatar_url,
        },
        select: {
            id: true,
        },
    });
    await updateSession(newUser.id);
    return redirect("/profile");
}

//로그인 함수화(세션을 겟하고, id를 넣어주고, 저장)
//깃허브로 가입 시 사용자명
//user의 email 가져오기(같은 access token 사용 가능)
//access token 가져오는 함수 / user profile 가져오는 함수 / user email 가져오는 함수 분리. 타입스크립트
