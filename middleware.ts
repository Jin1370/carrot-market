import { NextRequest, NextResponse } from "next/server";
import getSession from "./lib/session";

interface Routes {
    [key: string]: boolean;
}

//array보다 object가 탐색 빠름
const publicOnlyUrls: Routes = {
    "/": true,
    "/login": true,
    "/sms": true,
    "/create-account": true,
    "/github/start": true,
    "/github/complete": true,
};

//미들웨어는 edge runtime(node.js API의 경량 버전)에 실행-> 많은 것을 할 수는 없음
export async function middleware(request: NextRequest) {
    //함수명 반드시 middleware
    const session = await getSession();
    const exists = publicOnlyUrls[request.nextUrl.pathname];
    if (!session.id) {
        if (!exists) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    } else {
        if (exists) {
            return NextResponse.redirect(new URL("/home", request.url));
        }
    }
}

export const config = {
    //함수명 반드시 config
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
    //(?! ... ): 부정형 전방탐색. 괄호 안에 있는 패턴이 아니어야 한다는 뜻
    //.*: 위에서 제외된 경우가 아니라면, 나머지 모든 문자열을 매칭
    //모든 페이지 요청에 대해 미들웨어를 실행하지만, /api/*, /_next/static/*, /_next/image/*, /favicon.ico 같은 요청은 실행하지 않음
};
