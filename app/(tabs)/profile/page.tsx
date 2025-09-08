import db from "@/lib/db";
import getSession from "@/lib/session";
import { notFound, redirect } from "next/navigation";

async function getUser() {
    const session = await getSession();
    if (session.id) {
        const user = await db.user.findUnique({
            where: {
                id: session.id,
            },
        });
        if (user) {
            return user;
        }
    }
    notFound();
}

export default async function Profile() {
    const user = await getUser();
    const logOut = async () => {
        "use server"; //inline server action. <button onClick=..> 대신에 버튼을 form안에 만들고 action을 설정 ->client component로 만들지 않아도 됨
        const session = await getSession();
        await session.destroy();
        redirect("/");
    };
    return (
        <div>
            <h1>Welcome! {user?.username}</h1>
            <form action={logOut}>
                <button>Log out</button>
            </form>
        </div>
    );
}
