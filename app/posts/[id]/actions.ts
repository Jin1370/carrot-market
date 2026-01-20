"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { revalidatePath, revalidateTag } from "next/cache";

export async function likePost(postId: number) {
    const session = await getSession();
    try {
        await db.like.create({
            data: {
                postId: postId,
                userId: session.id!,
            },
        });
        revalidateTag(`like-status-${postId}`);
    } catch (e) {}
}

export async function dislikePost(postId: number) {
    try {
        const session = await getSession();
        await db.like.delete({
            where: {
                id: {
                    postId: postId,
                    userId: session.id!,
                },
            },
        });
        revalidateTag(`like-status-${postId}`);
    } catch (e) {}
}
export async function deleteComment(id: number, postId: number) {
    try {
        await db.comment.delete({
            where: {
                id,
            },
        });
        revalidateTag(`comments-${postId}`);
    } catch (e) {}
}

export async function uploadComment(postId: number, formData: FormData) {
    try {
        const payload = formData.get("comment");
        if (!payload || typeof payload !== "string") {
            return;
        }
        const session = await getSession();
        await db.comment.create({
            data: {
                payload,
                userId: session.id!,
                postId: postId,
            },
        });
        revalidateTag(`comments-${postId}`);
    } catch (e) {}
}
