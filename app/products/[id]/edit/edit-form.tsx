"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import { PhotoIcon } from "@heroicons/react/24/solid";
import { useActionState, useState } from "react";
import { editProduct } from "./actions"; // 같은 폴더의 actions

// product의 타입을 정의해두면 자동완성이 되어 편합니다.
interface ProductProps {
    id: number;
    photo: string;
    title: string;
    price: number;
    description: string;
}

export default function EditForm({ product }: { product: ProductProps }) {
    // 기존 이미지로 미리보기 설정
    const [preview, setPreview] = useState(product.photo);

    // 액션에 ID 바인딩 (이 게시물을 수정하겠다)
    // null은 this 바인딩용(Server Action에선 안씀), 두 번째 인자가 첫 번째 파라미터로 들어감
    const editProductWithId = editProduct.bind(null, product.id);

    const [state, action] = useActionState(editProductWithId, null);

    const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {
            target: { files },
        } = event;
        if (!files) return;
        const file = files[0];

        // 이미지 타입 검사
        if (!file.type.startsWith("image/")) {
            alert("이미지 파일만 업로드해주세요.");
            return;
        }

        // 용량 검사 (3MB)
        const maxSize = 3 * 1024 * 1024;
        if (file.size > maxSize) {
            alert("3MB 이하만 업로드 할 수 있습니다.");
            return;
        }

        // 미리보기 URL 생성
        const url = URL.createObjectURL(file);
        setPreview(url);
    };

    return (
        <form action={action} className="p-5 flex flex-col gap-5">
            <label
                htmlFor="photo"
                className="border-2 aspect-square flex flex-col items-center justify-center text-neutral-300 border-neutral-300 rounded-md border-dashed cursor-pointer bg-center bg-cover"
                style={{ backgroundImage: `url(${preview})` }}
            >
                {/* 이미지가 없을 때(혹은 깨졌을 때)만 아이콘 표시 */}
                {preview === "" ? (
                    <>
                        <PhotoIcon className="w-20" />
                        <div className="text-neutral-400 text-sm">
                            사진을 추가해주세요.
                            {state?.fieldErrors?.photo}
                        </div>
                    </>
                ) : null}
            </label>
            <input
                onChange={onImageChange}
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                className="hidden"
            />
            <Input
                name="title"
                required
                placeholder="제목"
                type="text"
                defaultValue={product.title}
                errors={state?.fieldErrors?.title}
            />
            <Input
                name="price"
                required
                placeholder="가격"
                type="number"
                defaultValue={product.price}
                errors={state?.fieldErrors?.price}
            />
            <Input
                name="description"
                required
                placeholder="자세한 설명"
                type="text"
                defaultValue={product.description}
                errors={state?.fieldErrors?.description}
            />
            <Button text="수정 완료" />
        </form>
    );
}
