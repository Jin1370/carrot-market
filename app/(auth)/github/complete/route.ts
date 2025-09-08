import {
    getAccessToken,
    getUserEmail,
    getUserProfile,
} from "@/lib/auth/github";
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
    //액세스 토큰 가져오기
    const { error, access_token } = await getAccessToken(code);
    if (error) {
        return new Response(null, {
            status: 400,
        });
    }
    //프로필 정보 가져오기
    let { id, avatar_url, login } = await getUserProfile(access_token);
    //이메일 가져오기
    const email = await getUserEmail(access_token);

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
