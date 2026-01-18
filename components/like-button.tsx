"use client";

import { HandThumbUpIcon } from "@heroicons/react/24/solid";
import { HandThumbUpIcon as OutlineHandThumbUpIcon } from "@heroicons/react/24/outline";
import { startTransition, useOptimistic } from "react";
import { dislikePost, likePost } from "@/app/posts/[id]/actions";

interface LikeButtonProps {
    isLiked: boolean;
    likeCount: number;
    postId: number;
}

export default function LikeButton({
    isLiked,
    likeCount,
    postId,
}: LikeButtonProps) {
    //첫번째 인자: 기존 데이터
    //두번째 인자: 데이터 수정 함수 (이전 상태, 핵심 데이터)
    const [state, reducerFn] = useOptimistic(
        { isLiked, likeCount },
        (previousState, payload) => {
            return {
                isLiked: !previousState.isLiked,
                likeCount: previousState.isLiked
                    ? previousState.likeCount - 1
                    : previousState.likeCount + 1,
            };
        },
    );
    const onClick = () => {
        startTransition(async () => {
            //startTransition: 조금 늦게 처리해도 되니까, 사용자가 클릭하는 동안 화면이 멈추지 않게 해줘
            reducerFn(undefined);
            if (isLiked) {
                await dislikePost(postId);
            } else {
                await likePost(postId);
            }
        });
    };
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 text-neutral-400 text-sm border border-neutral-400 rounded-full p-2 transition-colors 
                            ${state.isLiked ? "bg-orange-500 text-white border-orange-500" : " hover:bg-neutral-800"}`}
        >
            {state.isLiked ? (
                <HandThumbUpIcon className="size-5" />
            ) : (
                <OutlineHandThumbUpIcon className="size-5" />
            )}
            <span>{state.likeCount}</span>
        </button>
    );
}
