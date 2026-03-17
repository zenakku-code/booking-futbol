import { prisma } from "@/lib/prisma"
import Link from 'next/link'
import Image from 'next/image'
import { LiveStatsCounter } from '@/components/home/LiveStatsCounter'
import { FloatingCTA } from '@/components/home/FloatingCTA'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const [complexes, pricingConfig, totalBookings] = await Promise.all([
        (prisma as any).complex.findMany({
            orderBy: { name: 'asc' },
            where: { isActive: true }
        }),
        (prisma as any).systemConfig.findFirst({
            orderBy: { updatedAt: 'desc' }
        }),
        (prisma as any).booking.count().catch(() => 0)
    ])

    const prices = pricingConfig || {
        monthlyPrice: 10000,
        quarterlyPrice: 27000,
        annualPrice: 100000
    }

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-sans relative">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[40%] bg-primary/10 blur-[100px] rounded-full animate-float opacity-50 sm:opacity-100" />
                <div className="absolute bottom-[5%] right-[-5%] w-[45%] h-[35%] bg-accent/10 blur-[80px] rounded-full animate-float opacity-40 sm:opacity-100" style={{ animationDelay: '2s' }} />
            </div>

            {/* Global Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b-0 rounded-none py-3 sm:py-4 px-4 sm:px-6 md:px-12 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">
                        TIKI
                        <span className="text-primary italic">TAKA</span>
                    </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link href="/admin/login" className="text-[10px] sm:text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
                        Login
                    </Link>
                    <Link href="/register" className="btn btn-primary text-[10px] sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold">
                        REGISTRARSE
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-28 pb-10 sm:pt-32 sm:pb-16 md:pt-44 md:pb-28 px-4 flex flex-col items-center justify-center min-h-[85vh] sm:min-h-[90vh]">
                <div className="container relative text-center max-w-5xl mx-auto flex flex-col items-center justify-center animate-fade-in">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-5 hover:bg-white/10 transition-colors shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-default">
                        <span className="text-primary font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> 7 DÍAS GRATIS · SIN TARJETA
                        </span>
                    </div>

                    <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-5 mx-auto drop-shadow-2xl leading-[1.1] sm:leading-[1]">
                        <span className="text-white block">DIGITALIZÁ</span>
                        <span className="text-white block">TU COMPLEJO,</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-accent drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                            LLENÁ TUS CANCHAS
                        </span>
                    </h1>

                    <p className="text-sm sm:text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-8 font-medium leading-relaxed px-2">
                        Reservas online, cobros automáticos con Mercado Pago y gestión total. <strong className="text-white">Todo desde tu celular.</strong>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-md mx-auto z-20 px-4">
                        <Link href="/register" className="w-full sm:w-auto btn btn-primary text-sm sm:text-base shadow-[0_0_30px_rgba(16,185,129,0.4)] px-8 py-4 font-black">
                            EMPEZAR GRATIS
                        </Link>

                        <Link href="#explorar" className="w-full sm:w-auto btn btn-ghost text-sm sm:text-base px-8 py-4 glass hover:bg-white/10 text-white font-bold border-white/20">
                            VER CANCHAS
                        </Link>
                    </div>

                    {/* Live Stats */}
                    <div className="w-full max-w-4xl mx-auto mt-10 sm:mt-14">
                        <LiveStatsCounter />
                    </div>

                </div>
            </section>

            {/* Trust Signal Strip — Clubs Marquee */}
            {complexes.length > 0 && (
                <section className="relative z-10 border-y border-white/5 bg-white/[0.01] py-6 overflow-hidden">
                    <div className="container px-4">
                        <p className="text-center text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.3em] mb-4">
                            Clubes que ya confían en TIKITAKA
                        </p>
                    </div>
                    <div className="relative overflow-hidden">
                        <div className="flex animate-marquee gap-8 sm:gap-12 items-center whitespace-nowrap">
                            {[...complexes, ...complexes].map((complex: any, i: number) => (
                                <div key={`${complex.id}-${i}`} className="flex items-center gap-3 shrink-0 px-4 sm:px-6 py-2 rounded-full bg-white/[0.03] border border-white/5">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black shrink-0 overflow-hidden">
                                        {complex.logoUrl ? (
                                            <img src={complex.logoUrl} alt={complex.name} className="w-full h-full object-cover" />
                                        ) : (
                                            complex.name.charAt(0)
                                        )}
                                    </div>
                                    <span className="text-xs sm:text-sm text-gray-300 font-bold tracking-tight">{complex.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Onboarding Section */}
            <section className="py-16 sm:py-20 relative z-10 border-b border-white/5 bg-white/[0.01] backdrop-blur-sm">
                <div className="container px-4">
                    <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
                        <h2 className="text-primary font-bold text-[10px] sm:text-sm uppercase tracking-[0.2em] mb-3">CÓMO FUNCIONA</h2>
                        <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4">Empezá en 4 pasos</h3>
                        <p className="text-gray-500 text-xs sm:text-base italic px-4">Sin complicaciones. Sin tarjeta de crédito.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-7xl mx-auto">
                        <div className="flex flex-col items-center text-center group bg-white/[0.03] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 hover:border-primary/30 transition-all">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 sm:mb-5 border border-primary/20">
                                <span className="text-lg sm:text-xl font-black">1</span>
                            </div>
                            <h4 className="text-sm sm:text-lg font-bold text-white mb-1 sm:mb-2">Registrá tu Club</h4>
                            <p className="text-gray-500 text-[10px] sm:text-xs leading-relaxed">Perfil listo en minutos.</p>
                        </div>

                        <div className="flex flex-col items-center text-center group bg-white/[0.03] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 sm:mb-5 border border-blue-500/20">
                                <span className="text-lg sm:text-xl font-black">2</span>
                            </div>
                            <h4 className="text-sm sm:text-lg font-bold text-white mb-1 sm:mb-2">Elegí tu Plan</h4>
                            <p className="text-gray-500 text-[10px] sm:text-xs leading-relaxed"><span className="text-blue-400 font-bold">7 días gratis</span></p>
                        </div>

                        <div className="flex flex-col items-center text-center group bg-white/[0.03] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 hover:border-accent/30 transition-all">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3 sm:mb-5 border border-accent/20">
                                <span className="text-lg sm:text-xl font-black">3</span>
                            </div>
                            <h4 className="text-sm sm:text-lg font-bold text-white mb-1 sm:mb-2">Vinculá MP</h4>
                            <p className="text-gray-500 text-[10px] sm:text-xs leading-relaxed">Cobrá directo.</p>
                        </div>

                        <div className="flex flex-col items-center text-center group bg-white/[0.03] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3 sm:mb-5 border border-purple-500/20">
                                <span className="text-lg sm:text-xl font-black">4</span>
                            </div>
                            <h4 className="text-sm sm:text-lg font-bold text-white mb-1 sm:mb-2">Gestioná</h4>
                            <p className="text-gray-500 text-[10px] sm:text-xs leading-relaxed">Panel 100% digital.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Complexes Section */}
            <section id="explorar" className="py-16 sm:py-20 relative z-10 border-b border-white/5 bg-background">
                <div className="container px-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4 sm:gap-6">
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Complejos Destacados</h2>
                            <p className="text-gray-500 text-sm sm:text-base px-4 md:px-0">Explorá los mejores espacios deportivos cerca tuyo.</p>
                        </div>
                        <div className="mx-auto md:mx-0 glass px-4 py-1.5 rounded-full border-white/10 flex items-center gap-2 bg-white/5">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#f59e0b]"></span>
                            <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                                {complexes.length} Clubes
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {complexes.map((complex: any, idx: number) => (
                            <Link
                                key={complex.id}
                                href={`/${complex.slug}`}
                                className="group relative glass-card p-[1px] block no-underline overflow-hidden rounded-2xl sm:rounded-[2rem]"
                            >
                                <div className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden bg-gradient-to-br from-[#111] to-[#050505] flex items-center justify-center">
                                    {complex.logoUrl ? (
                                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 group-hover:scale-110 transition-transform duration-700 rounded-full overflow-hidden border-4 border-white/5 shadow-2xl">
                                            <Image
                                                src={complex.logoUrl}
                                                alt={complex.name}
                                                fill
                                                priority={idx < 2}
                                                className="object-cover"
                                                sizes="(max-width: 768px) 150px, 200px"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#111] to-[#050505]">
                                            <span className="text-5xl opacity-40 group-hover:scale-110 transition-transform duration-500">🏟️</span>
                                        </div>
                                    )}

                                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                                        <div className="glass bg-black/60 px-2.5 py-1 rounded-full border-white/10 backdrop-blur-md">
                                            <span className="text-[9px] sm:text-[10px] font-black text-primary tracking-widest">ONLINE</span>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-10">
                                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1.5 tracking-tight group-hover:text-primary transition-colors">{complex.name}</h3>
                                        {complex.address && (
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-3 h-3 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 capitalize truncate">
                                                    {complex.address}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}

                        <Link
                            href="/register"
                            className="group relative glass-card p-4 sm:p-8 flex flex-col items-center justify-center text-center min-h-[14rem] sm:min-h-[16rem] bg-indigo-600 font-bold text-white rounded-2xl sm:rounded-[2.5rem] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-black/20 group-hover:opacity-0 transition-opacity" />
                            <div className="relative z-10 flex flex-col items-center">
                                <span className="text-3xl sm:text-4xl mb-3 group-hover:animate-bounce">🚀</span>
                                <h3 className="text-lg sm:text-2xl font-black mb-1.5">¿ Sos dueño ?</h3>
                                <p className="text-white/80 text-[10px] sm:text-sm font-medium">Digitalizá tu complejo hoy.</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-16 sm:py-20 relative z-10 border-b border-white/5 bg-white/[0.01]">
                <div className="container px-4">
                    <div className="text-center mb-10 sm:mb-12">
                        <h2 className="text-primary font-bold text-[10px] sm:text-sm uppercase tracking-[0.2em] mb-3">PLANES</h2>
                        <h3 className="text-2xl sm:text-4xl font-black text-white mb-3">Precios simples y transparentes</h3>
                        <p className="text-gray-500 text-xs sm:text-sm">Sin costos ocultos. Cancelá cuando quieras.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto px-2">
                        {/* Monthly */}
                        <div className="glass p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border-white/5 bg-white/[0.02] flex flex-col group hover:border-primary/20 transition-all">
                            <h4 className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-3">Mensual</h4>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl sm:text-4xl font-black text-white">${prices.monthlyPrice.toLocaleString()}</span>
                                <span className="text-gray-500 text-xs sm:text-sm font-bold">/mes</span>
                            </div>
                            <ul className="text-[10px] sm:text-sm text-gray-400 space-y-3 mb-6 flex-1">
                                <li className="flex items-center gap-2">✅ Acceso completo</li>
                                <li className="flex items-center gap-2">✅ Soporte Prioritario</li>
                                <li className="flex items-center gap-2">✅ Sin contrato</li>
                            </ul>
                            <Link href="/register" className="btn btn-ghost w-full border-white/10 text-white font-bold py-3 sm:py-4 text-xs sm:text-sm">EMPEZAR</Link>
                        </div>

                        {/* Quarterly - Featured */}
                        <div className="glass p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border-primary/30 bg-primary/5 flex flex-col relative group md:scale-105 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[9px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-tighter whitespace-nowrap">AHORRA 10%</div>
                            <h4 className="text-primary font-bold uppercase text-[10px] tracking-widest mb-3">Trimestral PRO</h4>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl sm:text-4xl font-black text-white">${prices.quarterlyPrice.toLocaleString()}</span>
                                <span className="text-gray-400 text-xs sm:text-sm font-bold">/3 meses</span>
                            </div>
                            <ul className="text-[10px] sm:text-sm text-gray-300 space-y-3 mb-6 flex-1">
                                <li className="flex items-center gap-2">🔥 Todo el plan Mensual</li>
                                <li className="flex items-center gap-2">⚡ <strong className="text-white">Ahorrás ${(prices.monthlyPrice * 3 - prices.quarterlyPrice).toLocaleString()}</strong></li>
                                <li className="flex items-center gap-2">💰 Gestión de Pagos MP</li>
                            </ul>
                            <Link href="/register" className="btn btn-primary w-full shadow-[0_0_20px_rgba(16,185,129,0.3)] font-black py-3 sm:py-4 text-xs sm:text-sm">SUSCRIBIRSE</Link>
                        </div>

                        {/* Annual */}
                        <div className="glass p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border-amber-500/20 bg-amber-500/5 flex flex-col group hover:border-amber-500/40 transition-all relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-black text-[9px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-tighter whitespace-nowrap">MEJOR VALOR</div>
                            <h4 className="text-amber-500 font-bold uppercase text-[10px] tracking-widest mb-3">Full Anual</h4>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl sm:text-4xl font-black text-white">${prices.annualPrice.toLocaleString()}</span>
                                <span className="text-gray-500 text-xs sm:text-sm font-bold">/año</span>
                            </div>
                            <ul className="text-[10px] sm:text-sm text-gray-400 space-y-3 mb-6 flex-1">
                                <li className="flex items-center gap-2">🏆 Precio congelado 12 meses</li>
                                <li className="flex items-center gap-2">✨ Soporte VIP 24/7</li>
                                <li className="flex items-center gap-2">🚀 Ahorro Máximo</li>
                            </ul>
                            <Link href="/register" className="btn btn-ghost w-full border-amber-500/20 text-amber-500 font-bold py-3 sm:py-4 text-xs sm:text-sm">ELEGIR ANUAL</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-16 sm:py-24 relative z-10 bg-gradient-to-b from-background to-[#050505]">
                <div className="container px-4 text-center max-w-3xl mx-auto">
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        ¿Listo para llenar tus canchas?
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-lg mb-8 max-w-lg mx-auto">
                        Más de <strong className="text-white">{totalBookings.toLocaleString()} reservas</strong> ya se procesaron en la plataforma. Sumate hoy.
                    </p>
                    <Link href="/register" className="btn btn-primary text-sm sm:text-lg px-10 sm:px-14 py-4 sm:py-5 font-black shadow-[0_0_40px_rgba(16,185,129,0.4)] inline-block">
                        EMPEZAR MI PRUEBA GRATIS
                    </Link>
                    <p className="text-gray-600 text-[10px] sm:text-xs mt-4 font-bold">Sin tarjeta · Cancelá cuando quieras · Setup en 5 minutos</p>
                </div>
            </section>

            <footer className="py-8 sm:py-12 border-t border-white/5 bg-[#050505] relative z-10 flex flex-col items-center justify-center text-center pb-24 md:pb-12">
                <div className="container px-4">
                    <h2 className="text-2xl font-black text-white/10 mb-2 tracking-tighter">TIKITAKA</h2>
                    <p className="text-[10px] text-gray-600 font-bold tracking-[0.3em] uppercase">
                        &copy; {new Date().getFullYear()} SaaS Platform / Premium Experience
                    </p>
                </div>
            </footer>

            {/* Floating Mobile CTA */}
            <FloatingCTA />
        </main>
    )
}
