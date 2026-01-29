import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AccountSettings from "@/components/admin/AccountSettings"
import ComplexImageSettings from "@/components/admin/ComplexImageSettings"
import SubscriptionStatus from "@/components/admin/SubscriptionStatus"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const complexId = await getComplexId()
    if (!complexId) redirect('/admin/login')

    const [account, complex] = await Promise.all([
        prisma.account.findFirst({
            where: { complexId }
        }),
        prisma.complex.findUnique({
            where: { id: complexId }
        })
    ])

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Configuración</h2>
                <p className="text-gray-400">Gestiona los detalles, pagos y la apariencia de tu complejo.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2">
                    <SubscriptionStatus complex={complex} />
                </div>
                <ComplexImageSettings initialComplex={complex} />
                <AccountSettings initialAccount={account} />
            </div>
        </div>
    )
}
