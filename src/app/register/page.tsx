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

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tigh">
                        Booking <span className="text-primary italic">Futbol</span>
                    </h1>
                    <p className="text-gray-400">Registra tu complejo y empieza a recibir reservas.</p>
                </div>

                <div className="glass-card p-8 border border-white/10 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Crear Cuenta</h2>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 mb-6 text-sm animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Nombre del Complejo</label>
                            <input
                                type="text"
                                placeholder="Ej: La Bombonera Eze"
                                className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-600"
                                value={formData.complexName}
                                onChange={e => setFormData({ ...formData, complexName: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email del Administrador</label>
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-600"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Contraseña</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-600"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-primary to-green-600 text-slate-900 font-black rounded-xl shadow-[0_10px_20px_-10px_rgba(74,222,128,0.5)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Registrando...' : 'Registrar Complejo'}
                            {!isLoading && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-gray-500 text-sm">
                            ¿Ya tienes un complejo?{' '}
                            <Link href="/admin/login" className="text-primary font-bold hover:underline">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
