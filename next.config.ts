import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* 빌드 시 ESLint 에러가 있어도 무시하고 빌드를 완료합니다. */
    eslint: {
        ignoreDuringBuilds: true,
    },
    /* 빌드 시 타입 에러가 있어도 무시하고 빌드를 완료합니다. */
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                /*NextJS의 <Image/>는 이미지를 자동으로 최적화 -> 성능 향상
                하지만 외부 호스트의 이미지(다른 사이트의 이미지 링크 등)를 불러올 때는 보안 상의 이유로 허용 X -> hostname 등록 필요*/
                hostname: "avatars.githubusercontent.com",
            },
        ],
    },
};

export default nextConfig;
