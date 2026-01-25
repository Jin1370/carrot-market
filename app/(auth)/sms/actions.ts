"use server";

import { Vonage } from "@vonage/server-sdk";
import { Auth } from "@vonage/auth";
import { z } from "zod";
import validator from "validator";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import crypto from "crypto";
import { logIn } from "@/lib/session";

const phoneSchema = z
    .string()
    .trim()
    .refine((phone) => validator.isMobilePhone(phone, "ko-KR"), {
        message: "Wrong phone format",
        path: ["phone"],
    });

async function tokenExists(token: number) {
    const exists = await db.sMSToken.findUnique({
        where: {
            token: token.toString(),
        },
        select: {
            id: true,
        },
    });
    return Boolean(exists);
}

const tokenSchema = z.coerce
    .number()
    .min(100000)
    .max(999999)
    .refine(tokenExists, {
        message: "This token does not exist.",
        path: ["token"],
    }); //유저가 입력한 string을 number로 변환 시도. coercion:강제

interface ActionState {
    token: boolean;
}

async function getToken() {
    const token = crypto.randomInt(100000, 999999).toString();
    const exists = await db.sMSToken.findUnique({
        where: {
            token,
        },
        select: {
            id: true,
        },
    });
    if (exists) {
        return getToken();
    } else {
        return token;
    }
}

export async function smsLogin(prevState: ActionState, formData: FormData) {
    const phone = formData.get("phone");
    const token = formData.get("token");
    if (!prevState.token) {
        //이전에 token이 false였다면
        const result = phoneSchema.safeParse(phone);
        if (!result.success) {
            //사용자가 입력한 전화번호를 safeParse한 결과가 형식에 맞지 않는다면
            return {
                token: false,
                error: result.error.flatten(),
            };
        } else {
            //사용자가 입력한 전화번호를 safeParse한 결과가 형식에 맞는다면
            // delete previous token
            await db.sMSToken.deleteMany({
                where: {
                    user: {
                        phone: result.data,
                    },
                },
            });
            // create new token
            const token = await getToken();
            await db.sMSToken.create({
                data: {
                    token,
                    phone: result.data,
                    user: {
                        connectOrCreate: {
                            where: {
                                phone: result.data,
                            },
                            create: {
                                username: crypto
                                    .randomBytes(10)
                                    .toString("hex"),
                                phone: result.data,
                            },
                        },
                    },
                },
            });
            const credentials = new Auth({
                apiKey: process.env.VONAGE_API_KEY,
                apiSecret: process.env.VONAGE_API_SECRET,
            });
            const vonage = new Vonage(credentials);
            await vonage.sms.send({
                to: process.env.MY_PHONE_NUMBER!, //to: result.data
                from: process.env.VONAGE_SMS_FROM!,
                text: `Your Karrot verification code is: ${token}`,
            });
            return {
                token: true,
            };
        }
    } else {
        // 이전에 token이 true였다면
        const tokenResult = await tokenSchema.spa(token);
        const phoneResult = await phoneSchema.spa(phone);

        if (!tokenResult.success || !phoneResult.success) {
            return {
                token: true,
                error: {
                    fieldErrors: {
                        ...(tokenResult.success
                            ? {}
                            : tokenResult.error.flatten().fieldErrors),
                        ...(phoneResult.success
                            ? {}
                            : phoneResult.error.flatten().fieldErrors),
                    },
                },
            };
        } else {
            //사용자가 입력한 토큰과 전화번호를 safeParse한 결과가 형식에 맞고 db에 존재한다면
            const token = await db.sMSToken.findFirst({
                where: {
                    token: tokenResult.data.toString(),
                    phone: phoneResult.data.toString(),
                },
                select: {
                    id: true,
                    userId: true,
                },
            });
            if (token) {
                logIn(token!.userId);
                await db.sMSToken.delete({
                    where: {
                        id: token!.id,
                    },
                });
                redirect("/profile");
            } else {
                return {
                    token: true,
                    error: {
                        fieldErrors: { phone: ["Wrong phone number"] },
                    },
                };
            }
        }
    }
}
