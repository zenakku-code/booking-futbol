import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import SubscriptionClient from "./SubscriptionClient"
import { getOrSetCache } from "@/lib/redis"

export default async function SubscriptionPage() {
    const session = await getSession()
    if (!session || !session.complexId) redirect('/admin/login')

    const complexId = session.complexId

    const complex = await getOrSetCache(`complex_subscription_${complexId}`, async () => {
        return await (prisma as any).complex.findUnique({
            where: { id: complexId },
            select: {
                id: true,
                name: true,
                subscriptionActive: true,
                trialEndsAt: true,
                subscriptionDate: true,
                isActive: true
            }
        })
    }, 900) // 15 minutes cache

    if (!complex) {
        redirect('/admin/login')
    }

    return <SubscriptionClient complex={complex} />
}
