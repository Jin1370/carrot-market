"use client";

import { InitialChatMessages } from "@/app/chats/[id]/page";
import { formatToTimeAgo } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface ChatMessagesListProps {
    userId: number;
    initialMessages: InitialChatMessages;
}

export default function ChatMessagesList({
    userId,
    initialMessages,
}: ChatMessagesListProps) {
    const [messages, setMessages] = useState(initialMessages);
    return (
        <div className="p-5 flex flex-col gap-5 min-h-screen justify-end">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex gap-2 items-start ${message.userId === userId ? "justify-end" : ""}`}
                >
                    {message.userId === userId ? (
                        ""
                    ) : (
                        <Image
                            src={message.user.avatar!}
                            alt={message.user.username}
                            width={50}
                            height={50}
                            className="size-8 rounded-full"
                        />
                    )}
                    <div
                        className={`flex flex-col gap-1 ${message.userId === userId ? "items-end" : ""}`}
                    >
                        <span
                            className={`${message.userId === userId ? "bg-neutral-500" : "bg-orange-500"} p-2.5 rounded-md`}
                        >
                            {message.payload}
                        </span>
                        <span className="text-xs">
                            {formatToTimeAgo(message.created_at.toString())}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
