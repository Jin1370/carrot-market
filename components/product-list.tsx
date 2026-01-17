"use client";

import { InitialProducts } from "@/app/(tabs)/home/page";
import ListProduct from "./list-product";
import { useEffect, useRef, useState } from "react";
import { getMoreProducts } from "@/app/(tabs)/home/actions";

interface ProductListProps {
    initialProducts: InitialProducts;
}

export default function ProductList({ initialProducts }: ProductListProps) {
    const [products, setProducts] = useState(initialProducts);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [isLastPage, setIsLastPage] = useState(false);
    const trigger = useRef<HTMLSpanElement>(null); // 리렌더링했을 때 초기화되지 않고 값을 유지, 값이 변경되어도 리렌더링 되지 않음
    useEffect(() => {
        //trigger를 observe할 IntersectionObserver 생성
        const observer = new IntersectionObserver(
            async (
                entries: IntersectionObserverEntry[], //observe하는 모든 요소
                observer: IntersectionObserver, //observer 자체
            ) => {
                const element = entries[0];
                if (element.isIntersecting && trigger.current) {
                    observer.unobserve(trigger.current);
                    setIsLoading(true);
                    const newProducts = await getMoreProducts(page + 1);
                    if (newProducts.length !== 0) {
                        setPage((prev) => prev + 1); //page가 바뀜 -> useEffect 다시 실행됨.  unobserve했다가 다시 observe
                        setProducts((prev) => [...prev, ...newProducts]);
                    } else {
                        setIsLastPage(true);
                    }
                    setIsLoading(false);
                }
            },
            {
                threshold: 1.0,
                rootMargin: "0px 0px -100px 0px",
            },
        );
        //span에 trigger가 추가되면 trigger를 observe
        if (trigger.current) {
            observer.observe(trigger.current);
        }
        return () => {
            observer.disconnect(); //자원 해제. useEffect 안에서 return이 하는 역할은 클린업. 컴포넌트가 언마운트될 때 또는 다시 실행되기 직전
        };
    }, [page]); //dependency가 page

    return (
        <div className="p-5 flex flex-col gap-5">
            {products.map((product) => (
                <ListProduct key={product.id} {...product} /> //{...product}: props 간략하게 전달. id={product.id} title={product.title} ...
            ))}
            {/* {!isLastPage ? (
                <span
                    ref={trigger}
                    className="text-sm font-semibold bg-orange-500 w-fit mx-auto px-3 py-2 rounded-md hover:opacity-90 active:scale-95"
                >
                    {isLoading ? "로딩 중" : "Load more"}
                </span>
            ) : null} */}
        </div>
    );
}
