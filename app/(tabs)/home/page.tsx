import ListProduct from "@/components/list-product";
import ProductList from "@/components/product-list";
import db from "@/lib/db";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Prisma } from "@prisma/client";
import { unstable_cache as nextCache, revalidatePath } from "next/cache";
import Link from "next/link";

//cache 안에 "home-products"를 key로 하는 캐시가 있는지 확인하고 있으면 그 데이터를 넘겨줌, 없으면 key와 데이터를 저장
const getCachedProducts = nextCache(getInitialProducts, ["home-products"]);

async function getInitialProducts() {
    const products = await db.product.findMany({
        select: {
            title: true,
            price: true,
            created_at: true,
            photo: true,
            id: true,
        },
        //take: 1,
        orderBy: {
            created_at: "desc",
        },
    });
    return products;
}

//Prisma에게 getProducts가 return할 type이 무엇인지 알려줌
export type InitialProducts = Prisma.PromiseReturnType<
    typeof getInitialProducts
>;

export default async function Products() {
    const initialProducts = await getCachedProducts();
    const revalidate = async () => {
        "use server";
        revalidatePath("/home");
    };
    return (
        <div>
            <ProductList initialProducts={initialProducts} />
            <form action={revalidate}>
                <button>Revalidate</button>
            </form>
            <Link
                href="/products/add"
                className="bg-orange-500 flex items-center justify-center rounded-full size-16 fixed bottom-24 right-8 text-white transition-colors hover:bg-orange-400"
            >
                <PlusIcon className="size-10" />
            </Link>
        </div>
    );
}
