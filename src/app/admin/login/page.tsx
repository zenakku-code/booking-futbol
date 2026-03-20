'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth-client'

function LoginContent() {
    const [mode, setMode] = useState<'password' | 'magic-link'>('password')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isMagicLinkSent, setIsMagicLinkSent] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const isRegistered = searchParams.get('registered') === 'success'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            if (mode === 'password') {
                const res = await signIn.email({
                    email,
                    password,
                })

                if (res.error) {
                    setError(res.error.message || 'Credenciales incorrectas')
                } else if (res.data) {
                    const user = res.data.user as any
                    if (user.role === 'SUPERADMIN') {
                        router.push('/saas-admin')
                    } else {
                        router.push('/admin')
                    }
                }
            } else {
                // Magic Link Mode
                const res = await signIn.magicLink({
                    email,
                    callbackURL: '/admin'
                })

                if (res.error) {
                    setError(res.error.message || 'Error al enviar el enlace')
                } else {
                    setIsMagicLinkSent(true)
                }
            }
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        try {
            await signIn.social({
                provider: 'google',
                callbackURL: '/admin?firstLogin=true'
            })
        } catch (err) {
            setError('Error al conectar con Google')
            setIsLoading(false)
        }
    }

    return (
        <div className="relative z-10 w-full max-w-md animate-fade-in text-slate-200 px-4">
            <div className="glass-card p-10 md:p-14 backdrop-blur-3xl border border-white/[0.05] shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                {/* Subtle Glow Corner */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-1000"></div>

                <div className="text-center mb-12 relative z-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-[2rem] mb-8 border border-primary/20 shadow-inner overflow-hidden">
                        <img src="/logo-tikitaka.png" alt="Tiki Taka Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter leading-tight">
                        Tiki <span className="text-primary italic">Taka</span>
                    </h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] opacity-70">Acceso Administrativo</p>
                </div>

                {isRegistered && (
                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-8 text-xs font-bold animate-fade-in flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">✓</span>
                        ¡Complejo registrado! Inicia sesión para continuar.
                    </div>
                )}

                {isMagicLinkSent && (
                    <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl text-primary mb-8 text-xs font-bold animate-fade-in text-center shadow-lg shadow-primary/5">
                        📧 Enlace enviado. Revisa tu bandeja de entrada.
                    </div>
                )}

                {error && (
                    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-8 text-xs font-bold animate-shake flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">!</span>
                        {error}
                    </div>
                )}

                {/* Mode Toggle (Premium Design) */}
                <div className="flex bg-black/40 p-1.5 rounded-2xl mb-10 border border-white/5 relative">
                    <button
                        onClick={() => setMode('password')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 relative z-10 ${mode === 'password' ? 'text-slate-950 focus:outline-none' : 'text-gray-500 hover:text-white'}`}
                    >
                        Contraseña
                    </button>
                    <button
                        onClick={() => setMode('magic-link')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 relative z-10 ${mode === 'magic-link' ? 'text-slate-950 focus:outline-none' : 'text-gray-500 hover:text-white'}`}
                    >
                        Magic Link
                    </button>
                    {/* Animated Selector */}
                    <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-primary rounded-xl transition-all duration-500 ease-out shadow-lg shadow-primary/20 ${mode === 'magic-link' ? 'translate-x-full' : 'translate-x-0'}`}></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="space-y-3">
                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-700 placeholder:font-medium shadow-inner"
                            placeholder="admin@tucomplejo.com"
                            required
                        />
                    </div>

                    {mode === 'password' && (
                        <div className="space-y-3">
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Pin de Acceso</label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-700 pr-16 shadow-inner tracking-[0.3em]"
                                    placeholder="••••••••"
                                    required={mode === 'password'}
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
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-gradient-to-r from-primary to-green-600 text-slate-950 font-black rounded-2xl shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50 group/btn overflow-hidden relative flex items-center justify-center gap-2"
                    >
                        <span className="relative z-10 text-[11px] uppercase tracking-[0.2em]">
                            {isLoading ? 'Validando...' : mode === 'password' ? 'Acceder al Panel' : 'Enviar Link'}
                        </span>
                        {!isLoading && <span className="group-hover/btn:translate-x-1 transition-transform relative z-10">→</span>}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                    </button>
                </form>

                <div className="relative my-10 z-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/[0.05]"></div>
                    </div>
                    <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest">
                        <span className="bg-[#020617] px-4 text-gray-700">O ingresar con</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-4 py-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all focus:ring-2 focus:ring-white/10 outline-none disabled:opacity-50 z-10 relative"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google Sync
                </button>

                <div className="mt-12 text-center relative z-10 flex flex-col gap-4">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">¿Nuevo complejo?</p>
                    <Link href="/register" className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors border-b border-primary/20 pb-1 mx-auto pb-1.5">
                        Registrar Complejo Ahora ⚡
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-white/[0.03] text-center relative z-10">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-600 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all hover:tracking-[0.2em]"
                    >
                        ← Finalizar Sesión
                    </button>
                </div>
            </div>

            <p className="text-center mt-12 text-gray-700 text-[9px] font-black uppercase tracking-[0.3em] opacity-40">
                © 2026 Tiki Taka App - High performance Admin Panel
            </p>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects matching Register */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <Suspense fallback={<div className="text-white">Cargando...</div>}>
                <LoginContent />
            </Suspense>
        </div>
    )
}
