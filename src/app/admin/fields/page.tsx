import { prisma } from "@/lib/prisma"
import FieldManagement from "@/components/admin/FieldManagement"

export const dynamic = 'force-dynamic'

export default async function FieldsPage() {
    const fields = await prisma.field.findMany({
        orderBy: { type: 'asc' }
    })

    return <FieldManagement initialFields={fields} />
}
