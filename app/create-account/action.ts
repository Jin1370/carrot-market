"use server";
import {
    PASSWORD_MIN_LENGTH,
    PASSWORD_REGEX,
    PASSWORD_REGEX_ERROR,
} from "@/lib/constants";
import { z } from "zod";

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
            .toLowerCase()
            .trim()
            .transform((username) => `🥕${username}🥕`) //transform된 결과 반환. 만약 {} 쓸거면 return 반드시 필요. username => {return `🥕${username}🥕`}
            .refine(checkUserName, "custom error"), //T or F 반환
        email: z.string().email().toLowerCase(),
        password: z
            .string()
            .min(PASSWORD_MIN_LENGTH)
            .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
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
    const result = formSchema.safeParse(data);
    if (!result.success) {
        return result.error.flatten();
    } else {
        console.log(result.data);
    }
}
