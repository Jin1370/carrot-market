import db from "@/lib/db";
import { notFound } from "next/navigation";
import EditForm from "./edit-form";

export default async function EditProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const idNumber = Number(id);

    if (isNaN(idNumber)) return notFound();

    // 기존 데이터 가져오기
    const product = await db.product.findUnique({
        where: { id: idNumber },
    });

    if (!product) return notFound();

    return (
        // 클라이언트 컴포넌트로 데이터 전달
        <EditForm product={product} />
    );
}
