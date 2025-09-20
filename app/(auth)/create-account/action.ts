"use server";
import {
    PASSWORD_MIN_LENGTH,
    PASSWORD_REGEX,
    PASSWORD_REGEX_ERROR,
} from "@/lib/constants";
import db from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import getSession, { logIn } from "@/lib/session";

const checkUserName = (username: string) => !username.includes("potato");

const checkPasswords = ({
    password,
    confirm_password,
}: {
    password: string;
    confirm_password: string;
}) => password === confirm_password;

const formSchema = z
    .object({
        username: z
            .string({
                invalid_type_error: "Username must be a string!",
                required_error: "Where is my username???",
            })
            //.toLowerCase()
            .trim()
            //.transform((username) => `🥕${username}🥕`) //transform된 결과 반환. 만약 {} 쓸거면 return 반드시 필요. username => {return `🥕${username}🥕`}
            .refine(checkUserName, "no potatoes allowed!"), //T or F 반환. T면 통과
        email: z.string().email().toLowerCase(),
        password: z.string().min(PASSWORD_MIN_LENGTH),
        //.regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
        confirm_password: z.string().min(4),
    })
    .superRefine(async ({ username }, ctx) => {
        //인수 (data, context(에러모음))
        const user = await db.user.findUnique({
            where: {
                username,
            },
            select: {
                id: true,
            },
        });
        if (user) {
            ctx.addIssue({
                code: "custom",
                message: "This username is already taken",
                path: ["username"],
                fatal: true, //fatal:true로 하고 z.Never 반환하면 superRefine 이후의 다른 refine은 실행 X
            });
            return z.NEVER;
        }
    })
    .superRefine(async ({ email }, ctx) => {
        const user = await db.user.findUnique({
            where: {
                email,
            },
            select: {
                id: true,
            },
        });
        if (user) {
            ctx.addIssue({
                code: "custom",
                message: "This email is aleady taken",
                path: ["email"],
                fatal: true,
            });
            return z.NEVER;
        }
    })
    .refine(checkPasswords, {
        message: "Both passwords should be the same!",
        path: ["confirm_password"],
    });

export async function createAccount(prevState: any, formData: FormData) {
    const data = {
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
        confirm_password: formData.get("confirm_password"),
    };
    const result = await formSchema.safeParseAsync(data); // await, Async: checkUniqueUsername, checkUniqueEmail가 async이기 때문에 필요
    if (!result.success) {
        //console.log(result.error.flatten());
        return result.error.flatten();
    } else {
        const hashedPassword = await bcrypt.hash(result.data.password, 12);
        const user = await db.user.create({
            data: {
                username: result.data.username,
                email: result.data.email,
                password: hashedPassword,
            },
            select: {
                id: true,
            },
        });
        await logIn(user.id);
        redirect("/profile");
    }
}
