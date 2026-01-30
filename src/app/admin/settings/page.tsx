import { prisma } from "@/lib/prisma"
import ComplexImageSettings from "@/components/admin/ComplexImageSettings"
import ComplexNameSettings from "@/components/admin/ComplexNameSettings"
import OAuthConnect from "@/components/admin/OAuthConnect"
import PaymentSettings from "@/components/admin/PaymentSettings"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const complexId = await getComplexId()
    if (!complexId) redirect('/admin/login')

    const [account, complex] = await Promise.all([
        (prisma as any).account.findFirst({
            where: { complexId }
        }),
        (prisma as any).complex.findUnique({
            where: { id: complexId }
        })
    ])

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Configuración</h2>
                <p className="text-gray-400">Gestiona los detalles, pagos y la apariencia de tu complejo.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    <ComplexNameSettings initialComplex={complex} />
                    <PaymentSettings initialComplex={complex} />
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    <ComplexImageSettings initialComplex={complex} />
                </div>

                {/* Full Width - Integrations */}
                <div className="lg:col-span-2">
                    <OAuthConnect isConnected={!!(account as any)?.accessToken} mpUserId={(account as any)?.userId} complexId={complexId} />
                </div>
            </div>
        </div>
    )
}
