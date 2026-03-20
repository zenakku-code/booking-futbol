import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { dash } from "@better-auth/infra";
import { admin, magicLink } from "better-auth/plugins";
import bcrypt from "bcryptjs";

// Fallback seguro: usa JWT_SECRET si BETTER_AUTH_SECRET no existe en Vercel
const authSecret = process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || "dev-only-secret-change-me-in-production";

const baseURL = process.env.BETTER_AUTH_URL || 
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXT_PUBLIC_BASE_URL) || 
                "http://localhost:3000";

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
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
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
        dash({
            apiKey: process.env.BETTER_AUTH_API_KEY
        }),
        admin(),
        magicLink({
            sendMagicLink: async ({ email, url, token }, request) => {
                console.log(`[MagicLink] Rendering link for ${email}: ${url}`);
                
                // Integración con Resend
                if (process.env.RESEND_API_KEY) {
                    try {
                        const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                        const res = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
                            },
                            body: JSON.stringify({
                                from: from,
                                to: email,
                                subject: 'Tu enlace de acceso a Tiki Taka',
                                html: `
                                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                        <h2 style="color: #10b981;">Tiki Taka</h2>
                                        <p>Hacé clic en el siguiente botón para entrar a tu cuenta. Este enlace expirará pronto.</p>
                                        <div style="margin: 30px 0;">
                                            <a href="${url}" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                                ENTRAR AHORA
                                            </a>
                                        </div>
                                        <p style="font-size: 12px; color: #666;">Si no solicitaste este enlace, podés ignorar este correo.</p>
                                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                                        <p style="font-size: 10px; color: #999;">O copiá y pegá esta URL: <br/> ${url}</p>
                                    </div>
                                `
                            })
                        });

                        const data = await res.json();
                        if (!res.ok) {
                            console.error(`[MagicLink] Resend API Error:`, JSON.stringify(data, null, 2));
                        } else {
                            console.log(`[MagicLink] Email sent successfully to ${email} (via ${from})`);
                        }
                    } catch (e) {
                        console.error(`[MagicLink] Connection error sending email to ${email}`, e);
                    }
                } else {
                    console.warn(`[MagicLink] RESEND_API_KEY missing - check your .env file!`);
                }
            }
        }),
    ]
});

import { headers } from "next/headers";

// Wrapper for backwards compatibility across the old Next.js App Router codebase
export async function getSession() {
    const requestHeaders = await headers();
    const sessionData = await auth.api.getSession({ headers: requestHeaders });
    if (!sessionData) return null;
    return {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        role: sessionData.user.role,
        complexId: sessionData.user.complexId,
    };
}

export async function getComplexId() {
    const session = await getSession();
    return session?.complexId as string | null;
}
