import ChatMessagesList from "@/components/chat-messages";
import db from "@/lib/db";
import getSession from "@/lib/session";
import { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { experimental_taintObjectReference } from "react";

async function getRoom(id: string) {
    const room = await db.chatRoom.findUnique({
        where: {
            id,
        },
        include: {
            users: {
                select: { id: true },
            },
        },
    });
    if (room) {
        const session = await getSession();
        const canSee = Boolean(
            room.users.find((user) => user.id === session.id!),
        );
        if (!canSee) {
            return null;
        }
    }
    return room;
}

async function getMessages(chatRoomId: string) {
    const messages = await db.message.findMany({
        where: {
            chatRoomId,
        },
        select: {
            id: true,
            payload: true,
            created_at: true,
            userId: true,
            user: {
                select: {
                    avatar: true,
                    username: true,
                },
            },
        },
    });
    return messages;
}

async function getUserProfile() {
    const session = await getSession();
    const user = await db.user.findUnique({
        where: {
            id: session.id!,
        },
        select: {
            username: true,
            avatar: true,
        },
    });
    if (user) {
        // user 객체 클라이언트 컴포넌트로 전달 방지
        experimental_taintObjectReference(
            "보안 경고: User 정보가 클라이언트에 노출되었습니다.",
            user,
        );
    }
    return user;
}

export type InitialChatMessages = Prisma.PromiseReturnType<typeof getMessages>;

export default async function ChatRoom({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const room = await getRoom(id);
    if (!room) {
        return notFound;
    }
    const initialMessages = await getMessages(id);
    const session = await getSession();
    const user = await getUserProfile();
    if (!user) {
        return notFound();
    }
    return (
        <ChatMessagesList
            chatRoomId={id}
            userId={session.id!}
            username={user.username}
            avatar={user.avatar!}
            initialMessages={initialMessages}
        />
    );
}
