import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

interface SessionContent {
    id?: number;
}

export default async function getSession() {
    return await getIronSession<SessionContent>(await cookies(), {
        cookieName: "carrot-market",
        password: process.env.COOKIE_PASSWORD!, // !: null 또는 undefined가 아니라고 알려주는 역할
    });
}
