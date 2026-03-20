import { prisma } from "@/lib/prisma"
import FieldManagement from "@/components/admin/FieldManagement"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getOrSetCache } from "@/lib/redis"

export default async function FieldsPage() {
    const session = await getSession()
    if (!session || !session.complexId) redirect('/admin/login')
    const complexId = session.complexId

    const data = await getOrSetCache(`admin_fields_${complexId}`, async () => {
        const [fields, complex] = await Promise.all([
            prisma.field.findMany({
                where: { complexId },
                orderBy: { type: 'asc' }
            }),
            prisma.complex.findUnique({
                where: { id: complexId },
                select: { subscriptionActive: true }
            })
        ])
        return { fields, subscriptionActive: complex?.subscriptionActive || false }
    }, 300) // 5 minutes cache

    return <FieldManagement 
        initialFields={data.fields} 
        subscriptionActive={data.subscriptionActive} 
    />
}
