import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AccountSettings from "@/components/admin/AccountSettings"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const complexId = await getComplexId()
    if (!complexId) redirect('/admin/login')

    const account = await prisma.account.findFirst({
        where: { complexId }
    })

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Configuración</h2>
                <p className="text-gray-400">Gestiona las integraciones y ajustes de tu cuenta.</p>
            </header>

            <AccountSettings initialAccount={account} />
        </div>
    )
}
