/*
<cache methods>
[방법1]
const getCachedProducts = nextCache(getInitialProducts, ["home-products"]);
revalidatePath("/home") : nextCache, route cache, html cache 등 특정 경로의 모든 cache 새로고침
[방법2]
const getCachedProducts = nextCache(getInitialProducts, ["home-products"], {revalidate:60}); //60초 지난 데이터 요청 시 새로고침
[방법3]
const getCachedProducts = nextCache(getInitialProducts, ["home-products"], {tags: ["product", "list"]});
revalidateTag("product");
[api불러오는 경우]
fetch("https://api.com", {
    next: {
        revalidate: 50,
        tags: ["products"]
    }
})
revalidateTag("products");
[Route Segment Config 이용]
Route Segment Config: Next.js에서 각 페이지, 레이아웃, 라우트 핸들러의 동작 방식을 설정하는 기능
https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic'; // 이 페이지를 항상 동적으로 렌더링
export const revalidate = 60; // 60초 지난 데이터 요청 들어올 경우 새로고침
* 해당 페이지 파일 전체에 영향을 줌. 위의 방법들과 함께 사용하여 특정 데이터에 대한 설정도 가능

home은 사용자에 따라 보이는 화면이 다르지 않음 -> dynamic이 아닌 static으로 만들어짐(npm run build로 확인 가능)
-> 최신 데이터를 보여주려면 위의 방법들로 업데이트(html 바꿔주는 작업) 필요
*/

import ListProduct from "@/components/list-product";
import ProductList from "@/components/product-list";
import db from "@/lib/db";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Prisma } from "@prisma/client";
import { unstable_cache as nextCache, revalidatePath } from "next/cache";

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
    return (
        <div>
            <ProductList initialProducts={initialProducts} />
            <a
                href="/products/add"
                className="bg-orange-500 flex items-center justify-center rounded-full size-16 fixed bottom-24 right-8 text-white transition-colors hover:bg-orange-400"
            >
                <PlusIcon className="size-10" />
            </a>
        </div>
    );
}
