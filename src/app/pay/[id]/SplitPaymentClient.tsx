'use client'
import { useState } from 'react'

export default function SplitPaymentClient({ booking, remaining, isCompleted }: any) {
    // Calculos seguros pre-render
    const playersRaw = parseInt(booking.field.type)
    const players = isNaN(playersRaw) ? 5 : playersRaw

    const oneShare = Math.ceil(remaining / players)
    const halfShare = Math.ceil(remaining / 2)

    // Estado inicial: sugerir la mitad, o el total si es poco
    const [amount, setAmount] = useState<number>(halfShare)
    const [loading, setLoading] = useState(false)

    const handlePay = async () => {
        if (amount <= 0 || amount > remaining + 1) {
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

            if (!res.ok) throw new Error('Error creating payment')

            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch (e) {
            console.error(e)
            alert('Error iniciando el pago. Intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    if (isCompleted) {
        return (
            <div className="text-center p-8 bg-emerald-900/20 border border-emerald-500/30 rounded-3xl backdrop-blur-sm animate-fade-in">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-2">¡Misión Cumplida!</h2>
                <p className="text-emerald-200 mb-6">La cancha está pagada completamente.</p>
                <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                    <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Datos del Partido</p>
                    <p className="text-white font-bold text-lg mb-1">{booking.field.name}</p>
                    <p className="text-gray-300 mb-4">{new Date(booking.date).toLocaleDateString()} - {booking.startTime}hs</p>

                    <div className="border-t border-white/10 pt-4">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Capitán</p>
                        <p className="text-white font-mono">{booking.clientName}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass p-6 rounded-3xl animate-fade-in-up">
            <h3 className="text-center text-lg font-bold mb-6 text-white">¿Cuánto ponés hoy?</h3>

            <div className="grid grid-cols-3 gap-2 mb-6">
                <button
                    onClick={() => {
                        console.log('Setting amount to share:', oneShare);
                        setAmount(oneShare);
                    }}
                    className="flex flex-col items-center justify-center py-3 px-1 bg-slate-800/80 rounded-xl text-gray-400 hover:bg-primary/20 hover:text-primary hover:border-primary/50 border border-transparent transition-all active:scale-95"
                >
                    <span className="text-[10px] sm:text-xs font-bold uppercase">1/{players}</span>
                    <span className="text-sm font-black">${oneShare}</span>
                </button>

                <button
                    onClick={() => setAmount(halfShare)}
                    className="flex flex-col items-center justify-center py-3 px-1 bg-slate-800/80 rounded-xl text-gray-400 hover:bg-primary/20 hover:text-primary hover:border-primary/50 border border-transparent transition-all active:scale-95"
                >
                    <span className="text-[10px] sm:text-xs font-bold uppercase">La Mitad</span>
                    <span className="text-sm font-black">${halfShare}</span>
                </button>

                <button
                    onClick={() => setAmount(remaining)}
                    className="flex flex-col items-center justify-center py-3 px-1 bg-slate-800/80 rounded-xl text-gray-400 hover:bg-primary/20 hover:text-primary hover:border-primary/50 border border-transparent transition-all active:scale-95"
                >
                    <span className="text-[10px] sm:text-xs font-bold uppercase">Falta</span>
                    <span className="text-sm font-black">${remaining}</span>
                </button>
            </div>

            <div className="relative mb-8 group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-2xl group-focus-within:text-primary transition-colors">$</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    max={remaining}
                    placeholder="0"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-5 pl-10 pr-4 text-3xl font-black text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center placeholder:text-gray-700 font-mono"
                />
                <p className="text-center text-xs text-gray-500 mt-2">Quedan ${remaining} por pagar</p>
            </div>

            <button
                onClick={handlePay}
                disabled={loading || amount <= 0}
                className="w-full btn btn-primary py-4 text-xl font-black rounded-2xl shadow-[0_10px_30px_-10px_rgba(34,197,94,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(34,197,94,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
            >
                {loading ? (
                    <span className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <>
                        <span>Pagar con MP</span>
                        <span className="text-lg">💸</span>
                    </>
                )}
            </button>

            <p className="text-center text-[10px] text-gray-500 mt-6 px-4 leading-relaxed">
                El pago se procesa de forma segura a través de Mercado Pago. Se acreditará instantáneamente a la vaquita de este partido.
            </p>
        </div>
    )
}
