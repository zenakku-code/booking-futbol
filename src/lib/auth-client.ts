import { createAuthClient } from "better-auth/react"
import { dashClient } from "@better-auth/infra/client";
import { adminClient, magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    plugins: [
        dashClient(),
        adminClient(),
        magicLinkClient(),
    ]
})

export const { signIn, signUp, signOut, useSession } = authClient;
