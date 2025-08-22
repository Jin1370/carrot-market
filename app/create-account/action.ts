"use server";
import {
    PASSWORD_MIN_LENGTH,
    PASSWORD_REGEX,
    PASSWORD_REGEX_ERROR,
} from "@/lib/constants";
import db from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const checkUserName = (username: string) => !username.includes("potato");

const checkPasswords = ({
    password,
    confirm_password,
}: {
    password: string;
    confirm_password: string;
}) => password === confirm_password;

const checkUniqueUsername = async (username: string) => {
    const user = await db.user.findUnique({
        where: {
            username, //username: username
        },
        select: {
            id: true,
        },
    });
    return !Boolean(user); // Boolean(user) : user가 있으면 true, 없으면 false 리턴
};

const checkUniqueEmail = async (email: string) => {
    const user = await db.user.findUnique({
        where: {
            email,
        },
        select: {
            id: true,
        },
    });
    return !Boolean(user);
};

const formSchema = z
    .object({
        username: z
            .string({
                invalid_type_error: "Username must be a string!",
                required_error: "Where is my username???",
            })
            .toLowerCase()
            .trim()
            //.transform((username) => `🥕${username}🥕`) //transform된 결과 반환. 만약 {} 쓸거면 return 반드시 필요. username => {return `🥕${username}🥕`}
            .refine(checkUserName, "no potatoes allowed!") //T or F 반환. T면 통과
            .refine(checkUniqueUsername, "This username is already taken"),
        email: z
            .string()
            .email()
            .toLowerCase()
            .refine(
                checkUniqueEmail,
                "There is an account already registered with that email."
            ),
        password: z.string().min(PASSWORD_MIN_LENGTH),
        //.regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
        confirm_password: z.string().min(4),
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
        //cookie: 웹사이트를 방문했을 때 만들어진 정보를 저장하는 파일
        const cookie = await getIronSession(await cookies(), {
            cookieName: "carrot-market",
            password: process.env.COOKIE_PASSWORD!,
        });
        //@ts-ignore
        cookie.id = user.id;
        await cookie.save();
        redirect("/profile");
    }
}
