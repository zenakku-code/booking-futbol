import { prisma } from "@/lib/prisma"
import FieldManagement from "@/components/admin/FieldManagement"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function FieldsPage() {
    const complexId = await getComplexId()
    if (!complexId) redirect('/admin/login')

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

    return <FieldManagement initialFields={fields} subscriptionActive={complex?.subscriptionActive || false} />
}
