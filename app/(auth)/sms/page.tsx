"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import { useActionState } from "react";
import { smsLogin } from "./actions";

const initialState = {
    token: false,
    error: undefined,
};

export default function SMSLogIn() {
    const [state, trigger] = useActionState(smsLogin, initialState);
    return (
        <div className="flex flex-col gap-10 py-8 px-6">
            <div className="flex flex-col gap-2 *:font-medium">
                <h1 className="text-2xl">SMS Login</h1>
                <h2 className="text-xl">Verify your phone number.</h2>
            </div>
            <form action={trigger} className="flex flex-col gap-3">
                {state.token ? (
                    <div className="flex flex-col gap-3">
                        <Input
                            name="token"
                            type="number"
                            placeholder="Verification code"
                            required
                            min={100000} //minLength 아님 주의
                            max={999999}
                            errors={
                                (
                                    state.error?.fieldErrors as Record<
                                        string,
                                        string[]
                                    >
                                )?.token
                            }
                        />
                        <Input
                            name="phone"
                            type="text"
                            placeholder="Phone number (Verification Sent)"
                            required
                            errors={
                                (
                                    state.error?.fieldErrors as Record<
                                        string,
                                        string[]
                                    >
                                )?.phone
                            }
                        />
                    </div>
                ) : (
                    <Input
                        name="phone"
                        type="text"
                        placeholder="Phone number"
                        required
                        errors={
                            (
                                state.error?.fieldErrors as Record<
                                    string,
                                    string[]
                                >
                            )?.phone
                        }
                    />
                )}

                <Button
                    text={
                        state.token ? "Verify Token" : "Send Verification SMS"
                    }
                />
            </form>
        </div>
    );
}
