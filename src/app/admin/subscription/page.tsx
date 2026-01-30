import { prisma } from "@/lib/prisma"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"
import SubscriptionClient from "./SubscriptionClient"

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
    const complexId = await getComplexId()
    if (!complexId) redirect('/admin/login')

    const complex = await (prisma as any).complex.findUnique({
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

    if (!complex) {
        redirect('/admin/login')
    }

    return <SubscriptionClient complex={complex} />
}
