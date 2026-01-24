import db from "@/lib/db";
import getSession from "@/lib/session";
import { formatToTimeAgo } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

async function getChats(userId: number) {
    const chats = await db.chatRoom.findMany({
        where: {
            users: {
                some: {
                    id: userId,
                },
            },
        },
        select: {
            id: true,
            users: {
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                },
            },
            messages: {
                take: 1,
                orderBy: {
                    created_at: "desc",
                },
                select: {
                    payload: true,
                    created_at: true,
                },
            },
        },
    });
    return chats;
}
export const metadata = {
    title: "채팅",
};

export default async function Chat() {
    const session = await getSession();
    const chats = await getChats(session.id!);
    return (
        <div className="p-5 flex flex-col">
            {chats.map((chat) => {
                let opponent = chat.users.find((u) => u.id !== session.id);
                if (!opponent) opponent = chat.users[0];
                const lastMsg = chat.messages[0];
                return (
                    <Link
                        key={chat.id}
                        href={`chats/${chat.id}`}
                        className="flex items-center justify-between mb-5 pt-5 border-t border-neutral-500 last:mb-0 text-white"
                    >
                        <div className="flex items-center gap-5">
                            <Image
                                width={28}
                                height={28}
                                className="size-7 rounded-full"
                                src={opponent.avatar!}
                                alt={opponent.username}
                            />
                            <div className="flex flex-col">
                                <div>
                                    <span>{opponent.username}</span>
                                    <span> • </span>
                                    <span className="text-sm">
                                        {formatToTimeAgo(
                                            lastMsg.created_at.toString(),
                                        )}
                                    </span>
                                </div>
                                <span>{lastMsg.payload}</span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
