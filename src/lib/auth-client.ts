import { createAuthClient } from "better-auth/react"
import { dashClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    plugins: [
        dashClient()
    ]
})

export const { signIn, signUp, signOut, useSession } = authClient;
