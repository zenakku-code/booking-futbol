'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SplitPaymentForm({ booking, remaining, isCompleted }: any) {
    const router = useRouter()

    // Parser inteligente para extraer número de jugadores
    // Ej: "Futbol 5" -> 5, "F7" -> 7, "11" -> 11
    const extractPlayers = (type: string) => {
        if (!type) return 0
        const match = type.toString().match(/\d+/)
        return match ? parseInt(match[0]) : 0
    }

    const playersRaw = extractPlayers(booking.field.type)
    // Default a 5 si no se puede determinar
    const players = playersRaw > 0 ? playersRaw : 5

    // Safety check para evitar NaN si remaining viene mal
    const safeRemaining = typeof remaining === 'number' && !isNaN(remaining) ? remaining : 0

    // Floor para asegurar enteros
    const oneShare = Math.floor(safeRemaining / players)
    const halfShare = Math.floor(safeRemaining / 2)

    const [amount, setAmount] = useState<number>(0)
    const [loading, setLoading] = useState(false)

    // Auto-refresh si cambia el estado (polling simple o reload manual requerido)
    // Por ahora confiamos en el render inicial.

    const handleAmountChange = (val: number) => {
        if (!isNaN(val) && val > 0) {
            setAmount(val)
        }
    }

    const handlePay = async () => {
        if (amount <= 0 || amount > safeRemaining + 1) {
            alert('Monto inválido')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    amount: amount
                })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Error creating payment')
            }

            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch (e: any) {
            console.error(e)
            alert(e.message || 'Error iniciando el pago.')
        } finally {
            setLoading(false)
        }
    }

    if (isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <span className="text-6xl">🎉</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">¡Misión Cumplida!</h2>
                <p className="text-emerald-300 text-lg md:text-xl max-w-md mx-auto mb-8 font-medium">
                    La cancha está pagada completamente. ¡A jugar! ⚽
                </p>
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 w-full max-w-sm backdrop-blur-md">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Detalle</p>
                    <p className="text-white font-bold text-xl mb-1">{booking.field.name}</p>
                    <div className="flex justify-center items-center gap-2 text-gray-300">
                        <span>🗓️ {new Date(booking.date).toLocaleDateString()}</span>
                        <span>⏰ {booking.startTime}hs</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass p-6 md:p-8 rounded-3xl animate-fade-in-up border border-white/10 shadow-2xl relative overflow-hidden mx-auto w-full max-w-md">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 blur-sm"></div>

            <h3 className="text-center text-lg md:text-xl font-bold mb-6 text-white tracking-wide">¿Cuánto ponés hoy?</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <button
                    type="button"
                    onClick={() => handleAmountChange(oneShare)}
                    className="group relative flex sm:flex-col items-center justify-between sm:justify-center p-4 bg-slate-800/50 rounded-2xl border border-white/5 hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 active:scale-95 cursor-pointer z-10"
                >
                    <span className="text-xs uppercase font-bold text-gray-400 group-hover:text-primary transition-colors pointer-events-none">1/{players} P.</span>
                    <span className="text-xl font-black text-white group-hover:text-primary transition-colors pointer-events-none">${oneShare}</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleAmountChange(halfShare)}
                    className="group relative flex sm:flex-col items-center justify-between sm:justify-center p-4 bg-slate-800/50 rounded-2xl border border-white/5 hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 active:scale-95 cursor-pointer z-10"
                >
                    <span className="text-xs uppercase font-bold text-gray-400 group-hover:text-primary transition-colors pointer-events-none">La Mitad</span>
                    <span className="text-xl font-black text-white group-hover:text-primary transition-colors pointer-events-none">${halfShare}</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleAmountChange(safeRemaining)}
                    className="group relative flex sm:flex-col items-center justify-between sm:justify-center p-4 bg-slate-800/50 rounded-2xl border border-white/5 hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 active:scale-95 cursor-pointer z-10"
                >
                    <span className="text-xs uppercase font-bold text-gray-400 group-hover:text-primary transition-colors pointer-events-none">Total</span>
                    <span className="text-xl font-black text-white group-hover:text-primary transition-colors pointer-events-none">${safeRemaining}</span>
                </button>
            </div>

            <div className="relative mb-3 group bg-slate-900/50 rounded-3xl border border-white/10 focus-within:border-primary/50 transition-colors p-2 transition-all">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-black text-3xl group-focus-within:text-white transition-colors">$</span>
                <input
                    type="number"
                    value={amount === 0 ? '' : amount}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        setAmount(isNaN(val) ? 0 : val)
                    }}
                    max={safeRemaining}
                    placeholder="0"
                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-5xl font-black text-white focus:ring-0 text-center placeholder:text-gray-800 font-sans outline-none"
                    style={{ appearance: 'textfield' }}
                />
            </div>
            <p className="text-center text-xs text-gray-500 mb-8">Faltan abonar <span className="text-emerald-400 font-bold">${safeRemaining}</span></p>

            <button
                onClick={handlePay}
                disabled={loading || amount <= 0}
                className="w-full btn btn-primary py-5 text-xl font-black rounded-2xl shadow-[0_0_40px_-10px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_-10px_rgba(34,197,94,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl"></div>
                {loading ? (
                    'Procesando...'
                ) : (
                    <>
                        <span className="relative z-10">Ir a Pagar</span>
                        <span className="bg-black/20 px-2 py-0.5 rounded text-sm relative z-10 transform group-hover:rotate-12 transition-transform">MP</span>
                    </>
                )}
            </button>
        </div>
    )
}
