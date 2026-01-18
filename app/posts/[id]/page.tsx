import LikeButton from "@/components/like-button";
import db from "@/lib/db";
import getSession from "@/lib/session";
import { formatToTimeAgo } from "@/lib/utils";
import { EyeIcon } from "@heroicons/react/24/solid";
import { unstable_cache as nextCache, revalidateTag } from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";

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
        ["product-like-status"],
        {
            tags: [`like-status-${postId}`],
        },
    );
    return cachedOperation(postId);
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
        </div>
    );
}
