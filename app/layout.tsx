import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 1. Google Fonts 설정
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// 2. Local Font (Pretendard) 설정
const pretendard = localFont({
    src: "../fonts/pretendard/PretendardVariable.woff2",
    display: "swap",
    weight: "45 920",
    variable: "--font-pretendard",
});

export const metadata: Metadata = {
    title: {
        template: "%s | Karrot Market",
        default: "Karrot Market",
    },
    description: "Sell and buy all the things!",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className={pretendard.variable}>
            <body
                className={`${pretendard.className} ${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-900 text-white max-w-screen-sm mx-auto`}
            >
                {children}
            </body>
        </html>
    );
}
