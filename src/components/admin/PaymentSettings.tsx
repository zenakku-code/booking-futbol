'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentSettings({ initialComplex }: { initialComplex: any }) {
    const [enabled, setEnabled] = useState(initialComplex.downPaymentEnabled || false)
    const [amount, setAmount] = useState(initialComplex.downPaymentFixed || 0)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/complex', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    downPaymentEnabled: enabled,
                    downPaymentFixed: amount
                })
            })
            if (res.ok) {
                alert('✓ Configuración de pagos actualizada')
                router.refresh()
            } else {
                const errData = await res.json()
                alert(`Error al guardar: ${errData.details || errData.error || 'Desconocido'}`)
            }
        } catch (e) {
            alert('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass p-6 rounded-2xl border border-white/5">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                💰 Configuración de Seña
            </h3>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-white font-medium block">Habilitar Seña</label>
                        <p className="text-xs text-gray-400">Permite a los usuarios reservar pagando solo un adelanto.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={enabled}
                            onChange={e => setEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                </div>

                <div className={`transition-all duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                    <label className="block text-gray-400 text-sm mb-2">Monto de la Seña (Fijo)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                            className="w-full p-3 pl-8 bg-slate-900/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors font-mono"
                            placeholder="Ej: 5000"
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                        Este monto será obligatorio para reservar si no se paga el total. Si la cancha cuesta menos que la seña, se cobrará el valor de la cancha.
                    </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn btn-primary px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 shadow-lg shadow-primary/10"
                    >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    )
}
