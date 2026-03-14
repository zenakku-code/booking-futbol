'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SplitPaymentForm({ booking, remaining, isCompleted, depositGoal, depositReached }: any) {
    const router = useRouter()

    // Parser inteligente para extraer número de jugadores
    const extractPlayers = (type: string) => {
        if (!type) return 0
        const match = type.toString().match(/\d+/)
        return match ? parseInt(match[0]) : 0
    }

    const playersRaw = extractPlayers(booking.field.type)
    // Default a 5 si no se puede determinar (F5)
    const playersPerTeam = playersRaw > 0 ? playersRaw : 5
    // El total de jugadores es el doble (2 equipos)
    const totalPlayers = playersPerTeam * 2

    // Safety check
    const safeRemaining = typeof remaining === 'number' && !isNaN(remaining) ? remaining : 0

    // Floor para asegurar enteros
    const oneShare = Math.floor(safeRemaining / totalPlayers)
    const halfShare = Math.floor(safeRemaining / 2)

    const [amount, setAmount] = useState<number>(0)
    const [loading, setLoading] = useState(false)

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
            <div className="flex flex-col items-center justify-center p-10 text-center animate-fade-in glass-card border-primary/20 bg-primary/5">
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                    <span className="text-5xl">{remaining <= 10 ? '🏆' : '✅'}</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">
                    {remaining <= 10 ? '¡PARTIDO PAGADO!' : '¡RESERVA LISTA!'}
                </h2>
                <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 font-bold uppercase tracking-widest">
                    {remaining <= 10
                        ? 'El pago se completó con éxito. ¡A la cancha! ⚽'
                        : `Seña mínima de $${depositGoal} alcanzada. El turno está reservado.`}
                </p>
                <div className="bg-black/40 p-6 rounded-[2rem] border border-white/10 w-full backdrop-blur-3xl shadow-2xl">
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-3">Detalles del Turno</p>
                    <p className="text-white font-black text-2xl mb-1 tracking-tight">{(booking as any).field.name}</p>
                    <div className="flex justify-center items-center gap-4 text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">
                        <span className="flex items-center gap-1.5"><span className="text-primary text-base">📅</span> {new Date((booking as any).date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><span className="text-primary text-base">⏰</span> {(booking as any).startTime}hs</span>
                    </div>
                </div>
                {remaining > 10 && (
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-10 btn btn-primary px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl"
                    >
                        Saldar el resto →
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="glass-card p-8 rounded-[2rem] animate-fade-in-up border-white/10 shadow-2xl relative overflow-hidden mx-auto w-full max-w-md bg-slate-950/40 backdrop-blur-2xl">
            {/* Glossy top light */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

            <h3 className="text-center text-xs font-black mb-8 text-gray-500 uppercase tracking-[0.4em]">¿Cuánto aportás hoy?</h3>

            <div className="grid grid-cols-3 gap-3 mb-10">
                <button
                    type="button"
                    onClick={() => handleAmountChange(oneShare)}
                    className="group relative flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-primary/20 hover:border-primary/40 transition-all duration-300 active:scale-95 cursor-pointer z-10"
                >
                    <span className="text-[8px] uppercase font-black text-gray-500 group-hover:text-primary transition-colors tracking-widest mb-1">Tu Parte</span>
                    <span className="text-lg font-black text-white group-hover:text-primary transition-colors leading-none tracking-tighter">${oneShare}</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleAmountChange(halfShare)}
                    className="group relative flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-primary/20 hover:border-primary/40 transition-all duration-300 active:scale-95 cursor-pointer z-10"
                >
                    <span className="text-[8px] uppercase font-black text-gray-500 group-hover:text-primary transition-colors tracking-widest mb-1">Mitad</span>
                    <span className="text-lg font-black text-white group-hover:text-primary transition-colors leading-none tracking-tighter">${halfShare}</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleAmountChange(safeRemaining)}
                    className="group relative flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-primary/20 hover:border-primary/40 transition-all duration-300 active:scale-95 cursor-pointer z-10"
                >
                    <span className="text-[8px] uppercase font-black text-gray-500 group-hover:text-primary transition-colors tracking-widest mb-1">Todo</span>
                    <span className="text-lg font-black text-white group-hover:text-primary transition-colors leading-none tracking-tighter">${safeRemaining}</span>
                </button>
            </div>

            <div className="relative mb-4 group bg-black/40 rounded-3xl border border-white/5 focus-within:border-primary/40 transition-all p-4 shadow-inner">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-black text-3xl group-focus-within:text-primary transition-colors">$</span>
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
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-600 mb-10">
                Faltan abonar <span className="text-white">${safeRemaining}</span>
            </p>

            <button
                onClick={handlePay}
                disabled={loading || amount <= 0}
                className="w-full btn btn-primary py-6 text-xl font-black rounded-full shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)] hover:shadow-[0_0_50px_-10px_rgba(34,197,94,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3 group relative overflow-hidden"
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
