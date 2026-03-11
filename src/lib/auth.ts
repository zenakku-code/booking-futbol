import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { dash } from "@better-auth/infra";
import bcrypt from "bcryptjs";

// Fallback seguro: usa JWT_SECRET si BETTER_AUTH_SECRET no existe en Vercel
const authSecret = process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || "dev-only-secret-change-me-in-production";

const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// Construir orígenes confiables dinámicamente
const trustedOrigins: string[] = ["http://localhost:3000"];
if (process.env.VERCEL_URL) trustedOrigins.push(`https://${process.env.VERCEL_URL}`);
if (process.env.NEXT_PUBLIC_BASE_URL) trustedOrigins.push(process.env.NEXT_PUBLIC_BASE_URL);
if (process.env.BETTER_AUTH_URL) trustedOrigins.push(process.env.BETTER_AUTH_URL);

export const auth = betterAuth({
    secret: authSecret,
    baseURL,
    trustedOrigins,
    database: prismaAdapter(prisma, {
        provider: "sqlite",
    }),
    account: {
        modelName: "authAccount",
    },
    emailAndPassword: {
        enabled: true,
        password: {
            hash: async (password) => {
                return await bcrypt.hash(password, 10);
            },
            verify: async ({ password, hash }) => {
                return await bcrypt.compare(password, hash);
            }
        }
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "USER",
            },
            complexId: {
                type: "string",
                required: false,
            }
        }
    },
    plugins: [
        dash(),
    ]
});

// Wrapper for backwards compatibility across the old Next.js App Router codebase
export async function getSession() {
    const { headers } = await import("next/headers");
    const requestHeaders = await headers();
    const sessionData = await auth.api.getSession({ headers: requestHeaders });
    if (!sessionData) return null;
    return {
        id: sessionData.user.id,
        email: sessionData.user.email,
        role: sessionData.user.role,
        complexId: sessionData.user.complexId,
    };
}

export async function getComplexId() {
    const session = await getSession();
    return session?.complexId as string | null;
}
