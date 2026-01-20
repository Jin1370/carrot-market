import Button from "@/components/button";
import Input from "@/components/input";
import LikeButton from "@/components/like-button";
import db from "@/lib/db";
import getSession from "@/lib/session";
import { formatToTimeAgo } from "@/lib/utils";
import { EyeIcon } from "@heroicons/react/24/solid";
import {
    unstable_cache as nextCache,
    revalidatePath,
    revalidateTag,
} from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";
import { deleteComment, uploadComment } from "./actions";

async function getPost(id: number) {
    try {
        const post = await db.post.update({
            where: {
                id,
            },
            data: {
                views: {
                    increment: 1,
                },
            },
            include: {
                user: {
                    select: {
                        username: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });
        return post;
    } catch (e) {
        return null;
    }
}
function getCachedPost(postId: number) {
    const cachedOperation = nextCache(getPost, ["post-detail"], {
        tags: [`post-detail-${postId}`],
        revalidate: 60,
    });
    return cachedOperation(postId);
}

async function getLikeStatus(postId: number, userId: number) {
    //const session = await getSession();
    const isLiked = await db.like.findUnique({
        where: {
            id: {
                postId,
                userId,
            },
        },
    });
    const likeCount = await db.like.count({
        where: {
            postId,
        },
    });
    return { likeCount, isLiked: Boolean(isLiked) };
}
function getCachedLikeStatus(postId: number, userId: number) {
    const cachedOperation = nextCache(
        (postId) => getLikeStatus(postId, userId),
        ["like-status"],
        {
            tags: [`like-status-${postId}`],
        },
    );
    return cachedOperation(postId);
}

async function getComments(postId: number) {
    const comments = await db.comment.findMany({
        where: {
            postId,
        },
        select: {
            id: true,
            payload: true,
            created_at: true,
            userId: true,
            user: {
                select: {
                    username: true,
                    avatar: true,
                },
            },
        },
    });
    return comments;
}
function getCachedComments(postId: number) {
    const cachedOperation = nextCache(getComments, ["comments"], {
        tags: [`comments-${postId}`],
    });
    return cachedOperation(postId);
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const post = await getCachedPost(Number(id));
    return {
        title: post?.title || "포스트 상세",
    };
}

export default async function PostDetail({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: strId } = await params;
    const id = Number(strId);
    if (isNaN(id)) {
        return notFound();
    }
    const post = await getCachedPost(id);
    if (!post) {
        return notFound();
    }

    const session = await getSession();
    const { likeCount, isLiked } = await getCachedLikeStatus(id, session.id!);

    const comments = await getCachedComments(id);

    return (
        <div className="p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
                <Image
                    width={28}
                    height={28}
                    className="size-7 rounded-full"
                    src={post.user.avatar!}
                    alt={post.user.username}
                />
                <div>
                    <span className="text-sm font-semibold">
                        {post.user.username}
                    </span>
                    <div className="text-xs">
                        <span>
                            {formatToTimeAgo(post.created_at.toString())}
                        </span>
                    </div>
                </div>
            </div>
            <h2 className="text-lg font-semibold">{post.title}</h2>
            <p className="mb-5">{post.description}</p>
            <div className="flex flex-col gap-5 items-start">
                <div className="flex items-center gap-2 text-neutral-400 text-sm">
                    <EyeIcon className="size-5" />
                    <span>조회 {post.views}</span>
                </div>
                <LikeButton
                    isLiked={isLiked}
                    likeCount={likeCount}
                    postId={id}
                />
            </div>
            <div className="flex flex-col py-7">
                {comments.map((comment) => (
                    <div
                        key={comment.id}
                        className="flex items-center justify-between mb-5 pt-5 border-t border-neutral-500 last:mb-0 text-sm"
                    >
                        <div className="flex items-center gap-5">
                            <Image
                                width={28}
                                height={28}
                                className="size-7 rounded-full"
                                src={comment.user.avatar!}
                                alt={comment.user.username}
                            />
                            <div className="flex flex-col">
                                <div>
                                    <span>{comment.user.username}</span>
                                    <span> • </span>
                                    <span className="text-xs">
                                        {formatToTimeAgo(
                                            comment.created_at.toString(),
                                        )}
                                    </span>
                                </div>
                                <span>{comment.payload}</span>
                            </div>
                        </div>
                        {session.id === comment.userId ? (
                            <form
                                action={deleteComment.bind(
                                    null,
                                    comment.id,
                                    id,
                                )}
                            >
                                <button>삭제</button>
                            </form>
                        ) : null}
                    </div>
                ))}
            </div>
            <form
                action={uploadComment.bind(null, id)}
                className="fixed bottom-10 left-0 w-full flex flex-col gap-2 border-t border-neutral-500 p-5 bg-neutral-900"
            >
                <span>댓글 작성</span>
                <div className="flex w-full gap-2 items-start">
                    <div className="flex-[8]">
                        <Input
                            name="comment"
                            required
                            placeholder="댓글을 작성하세요"
                            type="text"
                        />
                    </div>
                    <div className="flex-[2]">
                        <Button text="완료" />
                    </div>
                </div>
            </form>
        </div>
    );
}
