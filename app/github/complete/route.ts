import db from "@/lib/db";
import getSession, { logIn } from "@/lib/session";
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
    //프로필 정보 가져오기
    const userProfileResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        cache: "no-cache",
    });
    let { id, avatar_url, login } = await userProfileResponse.json();

    //이메일 가져오기
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
    const email = emailData.find((e) => e.primary)?.email || emailData[0].email;

    // 이미 깃허브로 가입되어있으면 redirect
    const user = await db.user.findUnique({
        where: {
            github_id: id + "",
        },
        select: {
            id: true,
        },
    });
    if (user) {
        await logIn(user.id);
        return redirect("/profile"); //Route Handler(GET, POST 등)는 반드시 Response를 반환해야 함
    }
    // 깃허브로 가입되어 있지 않으면 새로 가입시킴
    // 깃허브 사용자명이 이미 가입된 사용자명과 중복되지 않는지 확인
    const checkNameExists = async (username: string) => {
        const user = await db.user.findUnique({
            where: {
                username,
            },
            select: {
                id: true,
            },
        });
        return Boolean(user);
    };
    login = (await checkNameExists(login)) ? login + "_git" : login;

    const newUser = await db.user.create({
        data: {
            username: login,
            github_id: id + "",
            avatar: avatar_url,
            email,
        },
        select: {
            id: true,
        },
    });
    await logIn(newUser.id);
    return redirect("/profile");
}

//로그인 함수화(세션을 겟하고, id를 넣어주고, 저장)
//깃허브로 가입 시 사용자명
//user의 email 가져오기(같은 access token 사용 가능)
//access token 가져오는 함수 / user profile 가져오는 함수 / user email 가져오는 함수 분리. 타입스크립트
