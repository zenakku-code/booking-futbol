import { prisma } from "@/lib/prisma"
import InventoryManagement from "@/components/admin/InventoryManagement"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
    const complexId = await getComplexId()
    if (!complexId) redirect('/admin/login')

    const items = await (prisma as any).inventoryItem.findMany({
        where: { complexId },
        orderBy: { name: 'asc' }
    })

    return <InventoryManagement initialItems={items} />
}
