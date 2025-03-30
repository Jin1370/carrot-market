"use server";

import { redirect } from "next/navigation";

export async function handleForm(prevState: any, formData: FormData) {
    console.log(prevState);
    console.log(formData.get("email"), formData.get("password"));
    console.log("I run in the server baby");
    //redirect("/");
    return {
        errors: ["wrong password", "password too short"],
    };
}
