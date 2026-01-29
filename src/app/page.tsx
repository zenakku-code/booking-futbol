import { prisma } from "@/lib/prisma"
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const complexes = await (prisma as any).complex.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/30">
            {/* Hero Section - SaaS Landing */}
            <div className="relative overflow-hidden pt-20 pb-32">
                <Image
                    src="/bg-hero.jpg"
                    alt="Background"
                    fill
                    priority
                    className="object-cover opacity-10 grayscale pointer-events-none"
                    sizes="100vw"
                />

                {/* Optimización Mobile: Ocultar efectos pesados de blur en pantallas pequeñas */}
                <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>

                <div className="container relative z-10 text-center px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
                        <span className="text-primary font-bold">New</span>
                        <span className="text-gray-400 text-sm">Plataforma Multi-complejo ya disponible</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-tight">
                        Gestiona tu complejo <br />
                        <span className="text-gradient italic">como un profesional.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12">
                        La plataforma definitiva para reservas de canchas.
                        Digitaliza tu negocio y aumenta tus ingresos hoy.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-8 pb-10">
                        <div className="relative">
                            <Link href="/register" className="btn btn-primary px-12 py-5 text-xl font-black rounded-2xl shadow-[0_20px_40px_-15px_rgba(74,222,128,0.5)] block">
                                Registrar mi Complejo
                            </Link>
                            <span className="absolute -bottom-8 left-0 w-full text-center text-gray-500 text-xs font-medium whitespace-nowrap">
                                Software Fee: <span className="text-white font-bold">$15.000 ARS</span> (pago único)
                            </span>
                        </div>
                        <Link href="#explorar" className="px-12 py-5 text-xl font-bold border border-white/10 rounded-2xl hover:bg-white/5 transition-all text-gray-300">
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
                    <p className="text-lg font-bold text-white/50 mb-4 tracking-tighter italic">Booking Futbol SaaS</p>
                    <p className="text-sm">© 2026 Plataforma Multi-tenencia. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    )
}
