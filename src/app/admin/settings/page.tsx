import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const account = await prisma.account.findFirst({
        where: { provider: 'mercadopago' } // Singleton for now
    })

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Configuración</h2>
                <p className="text-gray-400">Gestiona las integraciones y ajustes de tu cuenta.</p>
            </header>

            <div className="glass p-8 rounded-2xl max-w-2xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                        <img src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.104.0/mercadopago/logo__small.png" alt="MP" className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Mercado Pago</h3>
                        <p className="text-gray-400 text-sm">Conecta tu cuenta para recibir cobros de reservas.</p>
                    </div>
                </div>

                <div className="border-t border-slate-700 py-6">
                    {account ? (
                        <div className="flex items-center justify-between bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                            <div className="flex items-center gap-2 text-green-400 font-bold">
                                <span>✓</span>
                                <span>Cuenta Conectada</span>
                            </div>
                            <div className="text-sm text-gray-400">
                                ID: {account.id.substring(0, 8)}...
                            </div>
                            {/* Optionally verify token validity */}
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-300 mb-4">
                                Al conectar tu cuenta, tus clientes podrán pagar las reservas directamente desde la web.
                            </p>
                            <Link
                                href="/api/auth/mercadopago/login"
                                className="btn bg-[#009EE3] hover:bg-[#008BBF] text-white shadow-lg shadow-[#009EE3]/20"
                            >
                                Configurar Mercado Pago
                            </Link>
                        </div>
                    )}
                </div>

                <div className="mt-4 text-xs text-gray-500">
                    Nota: Asegúrate de tener configurado MP_CLIENT_ID y MP_CLIENT_SECRET en tus variables de entorno.
                </div>
            </div>
        </div>
    )
}
