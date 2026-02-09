'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginContent() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
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
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-600 pr-12"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                )}
                            </button>
                        </div>
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
                © 2026 Tiki Taka App - Admin Access Only
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
