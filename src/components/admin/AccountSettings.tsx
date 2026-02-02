'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountSettings({ initialAccount }: { initialAccount: any }) {
    const [account, setAccount] = useState(initialAccount)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleDisconnect = async () => {
        if (!confirm('¿Estás seguro de que deseas desconectar tu cuenta de Mercado Pago? Esto detendrá los pagos automáticos.')) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/auth/mercadopago/disconnect', { method: 'DELETE' })
            if (res.ok) {
                setAccount(null)
                router.refresh()
            } else {
                alert('Error al desconectar la cuenta')
            }
        } catch (error) {
            console.error(error)
            alert('Error al desconectar la cuenta')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="glass p-8 rounded-2xl max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                    <img src="/mercadopago.png" alt="MP" className="w-8 h-8 object-contain" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Mercado Pago</h3>
                    <p className="text-gray-400 text-sm">Conecta tu cuenta para recibir cobros de reservas.</p>
                </div>
            </div>

            <div className="border-t border-slate-700 py-6">
                {account ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                            <div className="flex items-center gap-2 text-green-400 font-bold">
                                <span>✓</span>
                                <span>Cuenta Conectada</span>
                            </div>
                            <div className="text-sm text-gray-400">
                                ID: {account.id.substring(0, 8)}...
                            </div>
                        </div>
                        <button
                            onClick={handleDisconnect}
                            disabled={isLoading}
                            className="text-sm text-red-400 hover:text-red-300 font-medium underline transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Desconectando...' : 'Desconectar cuenta'}
                        </button>
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
    )
}
