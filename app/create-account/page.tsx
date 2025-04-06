"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import SocialLogin from "@/components/social-login";
import { createAccount } from "./action";
import { useActionState } from "react";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

export default function CreateAccount() {
    const [state, trigger] = useActionState(createAccount, null);
    return (
        <div className="flex flex-col gap-10 py-8 px-6">
            <div className="flex flex-col gap-2 *:font-medium">
                <h1 className="text-2xl">안녕하세요!</h1>
                <h2 className="text-xl">Fill in the form below to join!</h2>
            </div>
            <form action={trigger} className="flex flex-col gap-3">
                <Input
                    type="text"
                    placeholder="Username"
                    required
                    name="username"
                    errors={state?.fieldErrors.username}
                />
                <Input
                    type="text"
                    placeholder="Email"
                    required
                    name="email"
                    errors={state?.fieldErrors.email}
                />
                <Input
                    type="password"
                    placeholder="Password"
                    required
                    name="password"
                    errors={state?.fieldErrors.password}
                    minLength={PASSWORD_MIN_LENGTH}
                />
                <Input
                    type="password"
                    placeholder="Confirm Password"
                    required
                    name="confirm_password"
                    errors={state?.fieldErrors.confirm_password}
                    minLength={PASSWORD_MIN_LENGTH}
                />
                <Button text="Create account" />
            </form>
            <SocialLogin />
        </div>
    );
}
