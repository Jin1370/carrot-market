"use server";

import { z } from "zod";
import fs from "fs/promises";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const productSchema = z.object({
    photo: z.string().optional(), // 사진은 필수가 아님
    title: z.string({ required_error: "Title is required" }),
    price: z.coerce.number({ required_error: "Price is required" }),
    description: z.string({ required_error: "Description is required" }),
});

export async function editProduct(
    productId: number,
    prevState: any,
    formData: FormData,
) {
    const data: Record<string, any> = {
        photo: formData.get("photo"),
        title: formData.get("title"),
        price: formData.get("price"),
        description: formData.get("description"),
    };

    // 사용자가 새 사진을 올린 경우 (File 객체이고 크기가 0보다 큼)
    if (data.photo instanceof File && data.photo.size > 0) {
        const photoData = await data.photo.arrayBuffer();
        // 파일 저장
        await fs.writeFile(
            `./public/${data.photo.name}`,
            Buffer.from(photoData),
        );
        // DB에 저장할 경로 문자열로 교체
        data.photo = `/${data.photo.name}`;
    } else {
        // 새 사진이 없으면 photo 필드를 undefined로 설정 -> Zod가 optional로 처리
        data.photo = undefined;
    }

    const result = productSchema.safeParse(data);

    if (!result.success) {
        return result.error.flatten();
    } else {
        // Prisma는 update 시 값이 undefined인 필드는 건드리지 않고 무시 -> photo가 undefined면 기존 사진이 유지되고, 문자열이면 새 사진으로 바뀜
        await db.product.update({
            where: {
                id: productId,
            },
            data: result.data,
        });

        revalidatePath(`/products/${productId}`);
        revalidatePath("/home");
        redirect(`/products/${productId}`);
    }
}
