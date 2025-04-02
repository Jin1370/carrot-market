"use client";

import FormButton from "@/components/form-btn";
import FormInput from "@/components/form-input";
import SocialLogin from "@/components/social-login";
import { createAccount } from "./action";
import { useActionState } from "react";

export default function CreateAccount() {
    const [state, trigger] = useActionState(createAccount, null);
    return (
        <div className="flex flex-col gap-10 py-8 px-6">
            <div className="flex flex-col gap-2 *:font-medium">
                <h1 className="text-2xl">안녕하세요!</h1>
                <h2 className="text-xl">Fill in the form below to join!</h2>
            </div>
            <form action={trigger} className="flex flex-col gap-3">
                <FormInput
                    type="text"
                    placeholder="Username"
                    required
                    name="username"
                    errors={state?.fieldErrors.username}
                />
                <FormInput
                    type="text"
                    placeholder="Email"
                    required
                    name="email"
                    errors={state?.fieldErrors.email}
                />
                <FormInput
                    type="password"
                    placeholder="Password"
                    required
                    name="password"
                    errors={state?.fieldErrors.password}
                />
                <FormInput
                    type="password"
                    placeholder="Confirm Password"
                    required
                    name="confirm_password"
                    errors={state?.fieldErrors.confirm_password}
                />
                <FormButton text="Create account" />
            </form>
            <SocialLogin />
        </div>
    );
}
