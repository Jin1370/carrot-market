import db from "@/lib/db";
import getSession from "@/lib/session";
import { formatToWon } from "@/lib/utils";
import { UserIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

async function getIsOwner(userId: number) {
    const session = await getSession();
    if (session.id) {
        return session.id === userId;
    }
    return false;
}

async function getProduct(id: number) {
    const product = await db.product.findUnique({
        where: {
            id,
        },
        include: {
            user: {
                select: {
                    username: true,
                    avatar: true,
                },
            },
        },
    });
    return product;
}

/*Next.js(App Router)에서 동적 라우트 파일 ([id]/page.tsx 같은 경우) 은 기본적으로 이런 객체를 인자로 넘겨줌:
function Page(props: { params: { id: string }, searchParams: Record<string, string> }) {}
구조분해할당-객체나 배열에서 필요한 값만 꺼내서 변수에 담는 문법*/
export default async function ProductDetail(props: {
    params: Promise<{ id: string }>;
}) {
    const { id: idStr } = await props.params; //구조 분해 할당 문법. 객체에서 id라는 속성을 꺼내서 idStr이라는 이름의 변수에 담겠다
    const id = Number(idStr);
    if (isNaN(id)) {
        return notFound();
    }
    const product = await getProduct(id);
    if (!product) {
        return notFound();
    }
    const isOwner = await getIsOwner(product.userId);

    const deleteProduct = async () => {
        "use server";
        await db.product.delete({
            where: {
                id: product.id,
            },
        });
        redirect("/products");
    };

    return (
        <div>
            <div className="relative aspect-square">
                <Image fill src={product.photo} alt={product.title} />
            </div>
            <div className="p-5 flex items-center gap-3 border-b border-neutral-700">
                <div className="size-10 overflow-hidden rounded-full">
                    {product.user.avatar !== null ? (
                        <Image
                            src={product.user.avatar}
                            width={40}
                            height={40}
                            alt={product.user.username}
                        />
                    ) : (
                        <UserIcon />
                    )}
                </div>
                <div>
                    <h3>{product.user.username}</h3>
                </div>
            </div>
            <div className="p-5">
                <h1 className="text-2xl font-semibold">{product.title}</h1>
                <p>{product.description}</p>
            </div>
            <div className="fixed w-full bottom-0 left-0 p-5 pb-10 bg-neutral-800 flex justify-between items-center">
                <span className="font-semibold text-xl">
                    {formatToWon(product.price)}원
                </span>
                {isOwner ? (
                    <form action={deleteProduct}>
                        <button className="bg-red-500 px-5 py-2.5 rounded-md text-white font-semibold">
                            Delete product
                        </button>
                    </form>
                ) : null}
                <Link
                    className="bg-orange-500 px-5 py-2.5 rounded-md text-white font-semibold"
                    href={``}
                >
                    채팅하기
                </Link>
            </div>
        </div>
    );
}
