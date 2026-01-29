'use client'
import { useState, useEffect } from 'react'

export default function SplitPaymentForm({ booking, remaining, isCompleted }: any) {
    const playersRaw = parseInt(booking.field.type)
    const players = isNaN(playersRaw) ? 5 : playersRaw

    // Floor para asegurar que la suma de partes no exceda por redondeo, 
    // aunque un centavo menos no mata a nadie.
    const oneShare = Math.floor(remaining / players)
    const halfShare = Math.floor(remaining / 2)

    const [amount, setAmount] = useState<number>(0)
    const [loading, setLoading] = useState(false)

    const handleAmountChange = (val: number) => {
        setAmount(val)
    }

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
                    <p className="text-white font-bold text-lg mb-1">{booking.field.name}</p>
                    <p className="text-gray-300">Reserva #{booking.id.slice(0, 4)}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="glass p-6 rounded-3xl animate-fade-in-up border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 blur-sm"></div>

            <h3 className="text-center text-lg font-bold mb-6 text-white tracking-wide">¿Cuánto ponés hoy?</h3>

            <div className="grid grid-cols-3 gap-3 mb-8">
                <button
                    type="button"
                    onClick={() => handleAmountChange(oneShare)}
                    className="group flex flex-col items-center justify-center py-4 px-2 bg-slate-800/50 rounded-2xl border border-white/5 hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.05] transition-all duration-300 active:scale-95"
                >
                    <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-primary mb-1 transition-colors">1/{players} P.</span>
                    <span className="text-lg font-black text-white group-hover:text-primary transition-colors">${oneShare}</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleAmountChange(halfShare)}
                    className="group flex flex-col items-center justify-center py-4 px-2 bg-slate-800/50 rounded-2xl border border-white/5 hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.05] transition-all duration-300 active:scale-95"
                >
                    <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-primary mb-1 transition-colors">La Mitad</span>
                    <span className="text-lg font-black text-white group-hover:text-primary transition-colors">${halfShare}</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleAmountChange(remaining)}
                    className="group flex flex-col items-center justify-center py-4 px-2 bg-slate-800/50 rounded-2xl border border-white/5 hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.05] transition-all duration-300 active:scale-95"
                >
                    <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-primary mb-1 transition-colors">Total</span>
                    <span className="text-lg font-black text-white group-hover:text-primary transition-colors">${remaining}</span>
                </button>
            </div>

            <div className="relative mb-2 group bg-slate-900/50 rounded-3xl border border-white/10 focus-within:border-primary/50 transition-colors p-2 transition-all">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-black text-3xl group-focus-within:text-white transition-colors">$</span>
                <input
                    type="number"
                    value={amount === 0 ? '' : amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    max={remaining}
                    placeholder="0"
                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-5xl font-black text-white focus:ring-0 text-center placeholder:text-gray-800 font-sans"
                />
            </div>
            <p className="text-center text-xs text-gray-500 mb-8">Faltan abonar <span className="text-emerald-400 font-bold">${remaining}</span></p>

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
