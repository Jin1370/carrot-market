import db from "@/lib/db";
import getSession from "@/lib/session";
import { formatToWon } from "@/lib/utils";
import { UserIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
    unstable_cache as nextCache,
    revalidatePath,
    revalidateTag,
} from "next/cache";

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
const getCachedProduct = nextCache(getProduct, ["product-detail"], {
    tags: ["product-detail"],
});

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const product = await getCachedProduct(Number(id));
    return {
        title: product?.title || "상품 상세",
    };
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
    const product = await getCachedProduct(id);
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
        revalidateTag("product-detail");
        revalidatePath("/home");
        redirect("/home");
    };
    const createChatRoom = async () => {
        "use server";
        const session = await getSession();
        const existingRoom = await db.chatRoom.findFirst({
            where: {
                AND: [
                    { users: { some: { id: product.userId } } },
                    { users: { some: { id: session.id } } },
                ],
            },
            select: {
                id: true,
            },
        });
        if (existingRoom) {
            return redirect(`/chats/${existingRoom.id}`);
        }
        const room = await db.chatRoom.create({
            data: {
                users: {
                    connect: [
                        {
                            id: product.userId,
                        },
                        {
                            id: session.id,
                        },
                    ],
                },
            },
            select: {
                id: true,
            },
        });
        redirect(`/chats/${room.id}`);
    };
    return (
        <div>
            <div className="relative aspect-square">
                <Image
                    fill
                    src={product.photo}
                    className="object-cover"
                    alt={product.title}
                />
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
                <div className="flex items-center gap-2">
                    {isOwner ? (
                        <>
                            <form action={deleteProduct}>
                                <button className="bg-red-500 px-5 py-2.5 rounded-md text-white font-semibold">
                                    삭제하기
                                </button>
                            </form>
                            <Link
                                className="bg-red-500 px-5 py-2.5 rounded-md text-white font-semibold"
                                href={`/products/${product.id}/edit`}
                            >
                                수정하기
                            </Link>
                        </>
                    ) : null}
                    <form action={createChatRoom}>
                        <button className="bg-orange-500 px-5 py-2.5 rounded-md text-white font-semibold">
                            채팅하기
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

/*
generateStaticParams: 빌드 시점에 동적 라우트([id])에 어떤 값들이 들어올지 미리 알려주어, 해당 페이지들을 미리 HTML로 만들어두는(정적 생성) 함수
동적 라우팅 페이지 일부를 정적 페이지(Static Page)로 변환하는 기능
원래 [id]가 붙은 페이지는 사용자가 접속할 때마다 서버가 DB를 조회해서 페이지를 만들지만, 미리 html을 만들어두면 바로 제공 가능
유저가 미리 생성되지 않은 페이지로 이동 시, dynamic page로 간주하고 db에 접속하여 화면을 보여준 뒤 저장하여 다시 static page가 됨
*서비스가 배포되기 전, 즉 빌드 타임(컴퓨터가 HTML을 굽는 시간)에 실행. 하지만 getSession()은 런타임(사용자가 접속한 순간)에 쿠키를 확인해야 알 수 있는 정보
    ->getIsOwner 로직을 클라이언트 컴포넌트로 분리하거나 페이지 렌더링 후에 처리

export async function generateStaticParams() {
    const products = await db.product.findMany({
        select: {
            id: true,
        },
    });
    return products.map((product) => ({ id: String(product.id) }));
}
*/
