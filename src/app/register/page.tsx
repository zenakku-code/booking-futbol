'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        complexName: '',
        email: '',
        password: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Error en el registro')
            }

            // Success! Redirect to login
            router.push('/admin/login?registered=success')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/bg-hero.jpg')] bg-cover opacity-10 grayscale pointer-events-none"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md relative z-10 transition-all duration-500">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-[2.5rem] mb-8 border border-primary/20 shadow-inner overflow-hidden">
                        <img src="/logo-tikitaka.png" alt="Tiki Taka Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter leading-tight">
                        Tiki <span className="text-primary italic">Taka</span>
                    </h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] opacity-70">Registro de Complejo Pro</p>
                </div>

                <div className="glass-card p-10 md:p-12 border border-white/[0.05] shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                    {/* Subtle Glow Corner */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-1000"></div>

                    <h2 className="text-xl font-black text-white mb-8 tracking-tighter uppercase border-b border-white/5 pb-4">
                        Crear <span className="text-primary">Cuenta</span>
                    </h2>

                    {error && (
                        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-8 text-xs font-bold animate-shake flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">!</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="space-y-3">
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Nombre del Complejo</label>
                            <input
                                type="text"
                                value={formData.complexName}
                                onChange={e => setFormData({ ...formData, complexName: e.target.value })}
                                className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-700 placeholder:font-medium shadow-inner"
                                placeholder="Ej: La Bombonera"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Email Admin</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-700 placeholder:font-medium shadow-inner"
                                placeholder="admin@tucomplejo.com"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Pin de Acceso</label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-700 pr-16 shadow-inner tracking-[0.3em]"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <p className="text-[9px] text-gray-600 mt-3 flex items-center gap-2 font-bold px-1">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                Mínimo 8 chars, una MAYÚS y un número.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-gradient-to-r from-primary to-green-600 text-slate-950 font-black rounded-2xl shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50 group/btn overflow-hidden relative flex items-center justify-center gap-2"
                        >
                            <span className="relative z-10 text-[11px] uppercase tracking-[0.2em]">
                                {isLoading ? 'Registrando...' : 'Registrar Complejo'}
                            </span>
                            {!isLoading && <span className="group-hover/btn:translate-x-1 transition-transform relative z-10">→</span>}
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/[0.05] text-center z-10 relative">
                        <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            ¿Ya tienes un complejo?
                            <Link href="/admin/login" className="text-primary hover:text-white transition-colors border-b border-primary/20 pb-0.5">
                                Iniciar Sesión 🔐
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
