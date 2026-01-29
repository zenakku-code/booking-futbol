import { prisma } from "@/lib/prisma"
import FieldManagement from "@/components/admin/FieldManagement"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function FieldsPage() {
    const complexId = await getComplexId()
    if (!complexId) redirect('/admin/login')

    const fields = await prisma.field.findMany({
        where: { complexId },
        orderBy: { type: 'asc' }
    })

    return <FieldManagement initialFields={fields} />
}
