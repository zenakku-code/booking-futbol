import { prisma } from "@/lib/prisma"
import FieldCard from "@/components/client/FieldCard"
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function ComplexPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ status?: string, booking_id?: string }>
}) {
    const { slug } = await params
    const { status, booking_id } = await searchParams

    const currentComplex = await (prisma as any).complex.findUnique({
        where: { slug }
    })

    if (!currentComplex) {
        notFound()
    }

    const fields = await (prisma as any).field.findMany({
        where: { complexId: currentComplex.id },
        include: { complex: true },
        orderBy: { type: 'asc' }
    })

    return (
        <div className="min-h-screen relative">
            {/* Fixed Background for better performance */}
            <div className="fixed inset-0 z-0">
                <Image
                    src="/bg-hero.jpg" // Using same efficient hero asset
                    alt="Stadium Background"
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-[#050505]/90 sm:bg-[#050505]/95" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <header className="absolute top-0 w-full p-6 z-50">
                    <div className="container flex justify-between items-center">
                        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            TikiTaka App
                        </Link>
                        <Link href="/" className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10">
                            ← Plataforma
                        </Link>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="min-h-[80vh] flex items-center justify-center text-center px-4 pt-20 relative overflow-hidden">
                    {/* Performance: Hide heavy animations on mobile */}
                    <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 animate-float" />
                    <div className="hidden md:block absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] -z-10 animate-float" style={{ animationDelay: '2s' }} />

                    <div className="max-w-4xl animate-fade-in z-10">
                        {status === 'success' && (
                            <div className="mb-8 p-4 sm:p-6 bg-[#111]/80 border border-primary/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] rounded-3xl backdrop-blur-xl animate-fade-in relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] pointer-events-none"></div>
                                <h4 className="text-lg sm:text-xl font-black text-primary mb-1 flex items-center justify-center gap-2">
                                    <span>✓</span> ¡Reserva Confirmada!
                                </h4>
                                <p className="text-gray-300 text-sm font-medium">
                                    Tu pago ha sido procesado con éxito. Te esperamos en la cancha.
                                    {booking_id && <span className="block mt-1 opacity-50 text-[10px] font-bold tracking-widest uppercase">ID: {booking_id}</span>}
                                </p>
                            </div>
                        )}

                        {status === 'failure' && (
                            <div className="mb-8 p-4 sm:p-6 bg-[#111]/80 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] rounded-3xl backdrop-blur-xl animate-shake relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-[50px] pointer-events-none"></div>
                                <h4 className="text-lg sm:text-xl font-black text-red-500 mb-1 flex items-center justify-center gap-2">
                                    <span>✕</span> Error en el Pago
                                </h4>
                                <p className="text-red-200/70 text-sm font-medium">
                                    No pudimos procesar tu pago. Por favor, intenta nuevamente o contacta al complejo.
                                </p>
                            </div>
                        )}

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-gray-300 text-sm font-medium">Disponible para Reserva</span>
                        </div>

                        <h2 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter mb-6 md:mb-8 leading-[1.1] drop-shadow-2xl">
                            {currentComplex.name}
                        </h2>

                        <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                            Reserva tu cancha en el mejor complejo de la zona.
                            Césped de calidad profesional y excelente iluminación.
                        </p>

                        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                            <a href="#canchas" className="btn btn-primary text-lg px-10 py-4 rounded-full shadow-[0_0_40px_-10px_rgba(74,222,128,0.5)] hover:scale-105 transition-transform">
                                Ver Canchas
                            </a>
                        </div>
                    </div>
                </section>

                {/* Fields Grid */}
                <section id="canchas" className="py-16 md:py-20 bg-[#050505]/60 backdrop-blur-2xl border-t border-white/5">
                    <div className="container px-4">
                        <div className="flex justify-between items-end mb-8 md:mb-12">
                            <div>
                                <h3 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                                    Nuestras Canchas
                                </h3>
                                <p className="text-gray-400 font-medium">
                                    Selecciona tu campo de juego en {currentComplex.name}.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {fields.map((field: any) => (
                                <FieldCard key={field.id} field={field} />
                            ))}
                            {fields.length === 0 && (
                                <div className="col-span-1 md:col-span-3 text-center py-20 bg-[#0A0A0A] rounded-3xl border border-dashed border-white/10 glass">
                                    <p className="text-gray-500 font-semibold text-lg">Este complejo aún no tiene canchas publicadas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <footer className="py-8 md:py-10 border-t border-white/5 text-center text-gray-600 text-sm font-semibold tracking-wider">
                    <p>© 2026 TIKITAKA - {currentComplex.name}</p>
                </footer>
            </div>
        </div>
    )
}
