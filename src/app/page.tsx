import { prisma } from "@/lib/prisma"
import Link from 'next/link'
import Image from 'next/image'
import { LiveStatsCounter } from '@/components/home/LiveStatsCounter'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const complexes = await (prisma as any).complex.findMany({
        orderBy: { name: 'asc' },
        where: { isActive: true } // Assuming we only show active ones
    })

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-sans">
            {/* Global Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b-0 rounded-none py-4 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        TIKI
                        <span className="text-primary italic">TAKA</span>
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/admin/login" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                        Iniciar Sesión
                    </Link>
                    <Link href="/register" className="btn btn-primary text-sm px-6 py-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        Únete Ahora
                    </Link>
                </div>
            </nav>

            {/* Glowing Orbs Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden h-screen z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-accent/20 blur-[120px] mix-blend-screen opacity-50 animate-float" style={{ animationDuration: '12s' }}></div>
                <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[100px] mix-blend-screen opacity-50 animate-float" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[150px] mix-blend-screen opacity-40"></div>

                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNCkiLz48L3N2Zz4=')] opacity-50"></div>
            </div>

            {/* Hero Section - SaaS Landing */}
            <section className="relative z-10 pt-40 pb-20 md:pt-48 md:pb-32 px-4 flex flex-col items-center justify-center min-h-[90vh]">
                <div className="container relative text-center max-w-5xl mx-auto flex flex-col items-center justify-center animate-fade-in">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-default">
                        <span className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> NUEVA PLATAFORMA
                        </span>
                        <span className="w-px h-3 bg-white/20"></span>
                        <span className="text-gray-300 text-xs font-medium">Gestión integral para complejos deportivos</span>
                    </div>

                    <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-6 mx-auto drop-shadow-2xl leading-[1.1]">
                        <span className="text-white">
                            <span className="inline-block pr-2" style={{ transform: 'skewX(-12deg)' }}>RESERVAR</span>
                            NUNCA FUE
                        </span>
                        <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-accent drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                            TAN FÁCIL
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed drop-shadow-md">
                        Digitaliza tu club, administra tus canchas sin esfuerzo y potencia tus ingresos. Únete a la nueva era del deporte amateur.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-sm sm:max-w-xl mx-auto z-20">
                        <Link href="#explorar" className="w-full sm:w-auto btn btn-primary text-lg shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] px-10 py-4 group">
                            Explorar Canchas
                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>

                        <Link href="/register" className="w-full sm:w-auto btn btn-ghost text-lg px-10 py-4 glass hover:bg-white/10 text-white font-medium border-white/20">
                            Soy Administrador
                        </Link>
                    </div>

                    {/* Live Stats Injection */}
                    <LiveStatsCounter />

                </div>
            </section>

            {/* Complexes Directory */}
            <section id="explorar" className="py-24 relative z-10 border-t border-white/5 bg-background/50 backdrop-blur-3xl">
                <div className="container px-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Complejos Destacados</h2>
                            <p className="text-gray-400 text-lg">Los mejores espacios deportivos, a un toque de distancia.</p>
                        </div>
                        <div className="glass px-6 py-2 rounded-full border-white/10 flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-accent animate-pulse"></span>
                            <span className="text-white font-semibold">
                                {complexes.length} Complejos Activos
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {complexes.map((complex: any) => (
                            <Link
                                key={complex.id}
                                href={`/${complex.slug}`}
                                className="group relative glass-card p-[1px] block no-underline focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {/* Gradient animated border via before */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />

                                <div className="relative h-72 w-full rounded-[1.4rem] overflow-hidden bg-[#0A0A0A] m-[1px]">
                                    {complex.logoUrl ? (
                                        <Image
                                            src={complex.logoUrl}
                                            alt={complex.name}
                                            fill
                                            className="object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#111] to-[#0A0A0A]">
                                            <span className="text-6xl mb-4 group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-500 saturate-0 opacity-50 group-hover:saturate-100 group-hover:opacity-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">🏟️</span>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-90" />

                                    <div className="absolute top-4 right-4 z-10">
                                        <div className="glass bg-black/40 px-3 py-1 rounded-full border-white/10 flex items-center gap-2 backdrop-blur-md">
                                            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#10b981]" />
                                            <span className="text-xs font-bold text-white tracking-wider">DISPONIBLE</span>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6 z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                        <h3 className="text-3xl font-black text-white mb-2 tracking-tight group-hover:text-primary transition-colors">{complex.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-sm font-medium text-gray-400">
                                                {complex.address || 'Ubicación Premium'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Add Complex CTA Card */}
                        <Link
                            href="/register"
                            className="group relative glass-card p-1 flex flex-col items-center justify-center text-center min-h-[300px] bg-gradient-to-b from-[#111] to-background border-dashed border-2 border-white/10 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                            <div className="relative z-10 p-8 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-2xl glass mb-6 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover:-rotate-3">
                                    <svg className="w-10 h-10 text-gray-500 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">Digitaliza tu Club</h3>
                                <p className="text-gray-400 text-sm max-w-xs font-medium">Únete a la plataforma y lleva la gestión de tus canchas al futuro.</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-white/5 bg-[#050505] relative z-10 flex flex-col items-center justify-center text-center">
                <div className="container">
                    <h2 className="text-2xl font-black text-white/20 mb-2 tracking-tighter">
                        TIKI<span className="italic ml-1">TAKA</span>
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">© {new Date().getFullYear()} SaaS Platform. Crafted with precision.</p>
                </div>
            </footer>
        </div>
    )
}
