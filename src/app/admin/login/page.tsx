'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginContent() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const isRegistered = searchParams.get('registered') === 'success'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json()

            if (res.ok) {
                if (data.role === 'SUPERADMIN') {
                    router.push('/saas-admin')
                } else {
                    router.push('/admin')
                }
            } else {
                setError(data.details || data.error || 'Credenciales incorrectas')
            }
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative z-10 w-full max-w-md animate-fade-in">
            <div className="glass-card p-10 backdrop-blur-2xl border border-white/10 shadow-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                        Panel de <span className="text-gradient">Control</span>
                    </h1>
                    <p className="text-gray-400 text-sm">Ingresa tus credenciales de administrador</p>
                </div>

                {isRegistered && (
                    <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-200 mb-6 text-sm animate-fade-in">
                        ✓ ¡Complejo registrado! Ya puedes iniciar sesión.
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 mb-6 text-sm animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-600"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-600"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn btn-primary py-4 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <p className="text-gray-500 mb-2">¿No tienes un complejo todavía?</p>
                    <Link href="/register" className="text-primary font-bold hover:underline">
                        Registrar mi complejo
                    </Link>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-500 hover:text-white text-sm transition-colors"
                    >
                        ← Volver al sitio
                    </button>
                </div>
            </div>

            <p className="text-center mt-8 text-gray-600 text-xs">
                © 2026 Booking Futbol - Admin Access Only
            </p>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[url('/bg-hero.jpg')] bg-cover relative">
            <div className="absolute inset-0 bg-slate-950/90 z-0" />
            <Suspense fallback={<div className="text-white">Cargando...</div>}>
                <LoginContent />
            </Suspense>
        </div>
    )
}
