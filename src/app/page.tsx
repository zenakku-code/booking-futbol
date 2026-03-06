import { prisma } from "@/lib/prisma"
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const complexes = await (prisma as any).complex.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/30 overflow-x-hidden">
            {/* Hero Section - SaaS Landing */}
            <div className="relative overflow-hidden pt-24 pb-32">
                {/* Dynamic Backgrounds */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] bg-primary/20 rounded-full blur-[100px] md:blur-[120px] opacity-40 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] sm:w-[40vw] sm:h-[40vw] bg-blue-500/10 rounded-full blur-[80px] md:blur-[100px] opacity-30 -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

                <div className="container relative z-10 text-center px-4 md:px-6 max-w-5xl mx-auto flex flex-col items-center justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-10 shadow-xl">
                        <span className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider">Nuevo</span>
                        <span className="text-gray-300 text-xs sm:text-sm font-medium">Plataforma Multi-complejo disponible</span>
                    </div>

                    <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight mb-8 flex flex-row items-center justify-center gap-3 md:gap-4 drop-shadow-2xl">
                        <span className="text-white">TIKI</span>
                        <span className="text-gradient italic">TAKA</span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 px-2 sm:px-6 font-medium leading-relaxed">
                        La plataforma definitiva para reservas de canchas. <br className="hidden sm:block" />
                        Reservar ahora es en un toque.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch w-full max-w-xs sm:max-w-xl mx-auto">
                        <Link href="/register" className="group relative w-full sm:flex-1 py-4 px-6 sm:px-8 bg-primary hover:bg-primary/90 text-slate-950 text-base md:text-lg font-black rounded-2xl shadow-[0_0_40px_-10px_rgba(74,222,128,0.5)] hover:shadow-[0_0_60px_-15px_rgba(74,222,128,0.7)] hover:-translate-y-1 transition-all overflow-hidden flex items-center justify-center">
                            <span className="relative z-10">Registrar mi Complejo</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        </Link>

                        <Link href="#explorar" className="w-full sm:flex-1 py-4 px-6 sm:px-8 text-base md:text-lg font-bold border-2 border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all text-white text-center backdrop-blur-sm bg-white/5 flex items-center justify-center">
                            Explorar Canchas
                        </Link>
                    </div>
                </div>
            </div>

            {/* Complexes Directory */}
            <section id="explorar" className="py-24 bg-slate-900/50 backdrop-blur-md relative overflow-hidden">
                <div className="container px-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
                        <div>
                            <h2 className="text-4xl font-black text-white mb-4">Complejos Destacados</h2>
                            <p className="text-gray-400 text-lg">Encuentra el lugar perfecto para tu próximo partido.</p>
                        </div>
                        <div className="text-gray-500 font-medium italic underline underline-offset-8 decoration-primary/50">
                            {complexes.length} Complejos activos
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {complexes.map((complex: any) => (
                            <Link
                                key={complex.id}
                                href={`/${complex.slug}`}
                                className="group relative glass-card p-1 overflow-hidden transition-all duration-500 hover:-translate-y-2"
                            >
                                <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-800">
                                    {complex.logoUrl ? (
                                        <img
                                            src={complex.logoUrl}
                                            alt={complex.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                                            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500">🏟️</span>
                                            <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sin imagen</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{complex.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10">
                                                {complex.address || 'Ubicación Premium'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-4 right-4 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                    <div className="bg-primary text-slate-900 p-3 rounded-full shadow-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Add Complex Placeholder */}
                        <Link
                            href="/register"
                            className="group relative border-2 border-dashed border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-primary/5 transition-all transition-duration-500 min-h-[300px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <span className="text-3xl text-gray-500 group-hover:text-primary transition-colors">+</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-400 group-hover:text-white transition-colors">¿Eres dueño de un complejo?</h3>
                            <p className="text-gray-500 text-sm mt-2">Registra tu negocio y empieza a automatizar tus reservas.</p>
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="py-20 border-t border-white/5 text-center text-gray-600">
                <div className="container">
                    <p className="text-lg font-bold text-white/50 mb-4 tracking-tighter italic">Tiki Taka App</p>
                    <p className="text-sm">© 2026 Plataforma Multi-tenencia. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    )
}
