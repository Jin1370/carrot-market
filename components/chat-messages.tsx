"use client";

import { InitialChatMessages } from "@/app/chats/[id]/page";
import { formatToTimeAgo } from "@/lib/utils";
import { ArrowUpCircleIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { saveMessage } from "@/app/chats/actions";

const SUPABASE_PUBLIC_KEY = "sb_publishable_D_S9ITfdGFAfB_7VOABUMA_xgt0jhpR";
const SUPABASE_URL = "https://qwdsrxbqzmrmrgsysagb.supabase.co";

interface ChatMessagesListProps {
    chatRoomId: string;
    userId: number;
    initialMessages: InitialChatMessages;
    username: string;
    avatar: string;
}

export default function ChatMessagesList({
    chatRoomId,
    userId,
    initialMessages,
    username,
    avatar,
}: ChatMessagesListProps) {
    const [messages, setMessages] = useState(initialMessages);
    const [message, setMessage] = useState("");
    //useRef(): 컴포넌트 내 여러 함수 사이에서 데이터를 저장, 공유. 변경이 일어나도 리렌더링 없이 데이터 유지됨
    //-> useEffect에서 초기화하거나 참여한 channel에 접근 가능
    const channel = useRef<RealtimeChannel>(null);
    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {
            target: { value },
        } = event;
        setMessage(value);
        // = setMessage(event.target.value);
    };
    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessages((previousMsgs) => [
            ...previousMsgs,
            {
                id: Date.now(), //상관없음
                payload: message,
                created_at: new Date(),
                userId,
                user: {
                    username: "x", //상관없음
                    avatar: "x", //상관없음
                },
            },
        ]);
        channel.current?.send({
            type: "broadcast",
            event: "message",
            payload: {
                id: Date.now(), //상관없음
                payload: message,
                created_at: new Date(),
                userId,
                user: {
                    username,
                    avatar,
                },
            },
        });
        await saveMessage(message, chatRoomId);
        setMessage("");
    };
    //supabase 사용 -> https://supabase.com/docs/guides/realtime/broadcast
    useEffect(() => {
        const client = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
        channel.current = client.channel(`room-${chatRoomId}`);
        channel.current
            .on("broadcast", { event: "message" }, (payload) => {
                setMessages((prevMsgs) => [...prevMsgs, payload.payload]);
            })
            .subscribe();
        return () => {
            channel.current?.unsubscribe();
        };
    }, [chatRoomId]);
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
            <form className="flex relative" onSubmit={onSubmit}>
                <input
                    required
                    onChange={onChange}
                    value={message}
                    className="bg-transparent rounded-full w-full h-10 focus:outline-none px-5 ring-2 focus:ring-4 transition ring-neutral-200 focus:ring-neutral-50 border-none placeholder:text-neutral-400"
                    type="text"
                    name="message"
                    placeholder="write a message..."
                />
                <button className="absolute right-0">
                    <ArrowUpCircleIcon className="size-10 text-orange-500 transition-colors hover:text-orange-300" />
                </button>
            </form>
        </div>
    );
}
