'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function OnboardingFlow({ userEmail }: { userEmail: string }) {
    const [step, setStep] = useState<'welcome' | 'form' | 'success'>('welcome')
    const [complexName, setComplexName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleCreateComplex = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const res = await fetch('/api/admin/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ complexName })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Error al crear el complejo')
            }

            setStep('success')
            // Delay redirect to show success state
            setTimeout(() => {
                window.location.href = '/admin' // Force reload to refresh session/layout
            }, 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 overflow-hidden">
            {/* Backdrop Blur Over the Dashboard */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl"></div>
            
            {/* Floating Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>

            <main className="relative z-10 w-full max-w-2xl">
                <AnimatePresence mode="wait">
                    {step === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1, y: -20 }}
                            className="glass-card p-12 text-center border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
                        >
                            <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-primary/20 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/20 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full blur-2xl"></div>
                                <span className="text-5xl relative z-10">👋</span>
                            </div>
                            
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">
                                ¡Bienvenido a <span className="text-primary italic">Tiki Taka</span>!
                            </h2>
                            <p className="text-gray-400 text-lg mb-12 max-w-md mx-auto font-medium">
                                Hemos vinculado tu cuenta de <span className="text-white font-bold">{userEmail}</span> correctamente.
                            </p>
                            
                            <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl mb-12 text-left">
                                <p className="text-xs font-black uppercase tracking-widest text-primary mb-4">Misión Actual</p>
                                <p className="text-sm text-gray-300 leading-relaxed font-bold">
                                    Para empezar a gestionar turnos, necesitamos crear el perfil de tu complejo deportivo. Solo te tomará 30 segundos.
                                </p>
                            </div>

                            <button
                                onClick={() => setStep('form')}
                                className="w-full py-6 bg-primary text-slate-950 font-black rounded-2xl shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
                            >
                                Empezar Configuración →
                            </button>
                        </motion.div>
                    )}

                    {step === 'form' && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="glass-card p-12 border border-white/10"
                        >
                            <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">
                                Nombre de tu <span className="text-primary italic">Complejo</span>
                            </h2>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12">Paso 1 de 1: Identidad Digital</p>

                            {error && (
                                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-8 text-xs font-bold animate-shake">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleCreateComplex} className="space-y-10">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Nombre Comercial</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={complexName}
                                        onChange={(e) => setComplexName(e.target.value)}
                                        className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl text-white font-black text-xl focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-800 shadow-inner"
                                        placeholder="Ej: Arena Fútbol Club"
                                        required
                                    />
                                    <p className="text-[9px] text-gray-700 font-bold px-2">Este será tu link público: <span className="text-primary">tikitaka.app/p/tu-nombre</span></p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !complexName}
                                    className="w-full py-6 bg-gradient-to-r from-primary to-emerald-600 text-slate-950 font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:grayscale transition-all text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                                >
                                    {isLoading ? 'Creando...' : 'Crear Complejo 🚀'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-16 text-center border border-primary/20 shadow-[0_0_100px_rgba(16,185,129,0.3)]"
                        >
                            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                                <span className="text-5xl text-slate-950">✓</span>
                            </div>
                            <h2 className="text-4xl font-black text-white mb-6 tracking-tighter">¡Todo Listo!</h2>
                            <p className="text-gray-400 font-bold mb-10 max-w-sm mx-auto leading-relaxed">
                                Tu complejo <span className="text-primary">"{complexName}"</span> ha sido configurado con éxito.
                            </p>
                            
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2.5 }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest animate-pulse">Accediendo al Panel...</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
