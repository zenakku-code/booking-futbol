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
                <div className="absolute inset-0 bg-slate-900/90" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <header className="absolute top-0 w-full p-6 z-50">
                    <div className="container flex justify-between items-center">
                        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            Booking Futbol
                        </Link>
                        <Link href="/" className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10">
                            ← Plataforma
                        </Link>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="min-h-[80vh] flex items-center justify-center text-center px-4 pt-20 relative overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] -z-10 animate-float" style={{ animationDelay: '2s' }} />

                    <div className="max-w-4xl animate-fade-in z-10">
                        {status === 'success' && (
                            <div className="mb-8 p-6 bg-green-500/20 border border-green-500/50 rounded-3xl backdrop-blur-xl animate-fade-in">
                                <h4 className="text-xl font-bold text-green-400 mb-1 flex items-center justify-center gap-2">
                                    <span>✓</span> ¡Reserva Confirmada!
                                </h4>
                                <p className="text-green-200/70 text-smSmall">
                                    Tu pago ha sido procesado con éxito. Te esperamos en la cancha.
                                    {booking_id && <span className="block mt-1 opacity-50 text-[10px]">ID: {booking_id}</span>}
                                </p>
                            </div>
                        )}

                        {status === 'failure' && (
                            <div className="mb-8 p-6 bg-red-500/20 border border-red-500/50 rounded-3xl backdrop-blur-xl animate-shake">
                                <h4 className="text-xl font-bold text-red-400 mb-1 flex items-center justify-center gap-2">
                                    <span>✕</span> Error en el Pago
                                </h4>
                                <p className="text-red-200/70 text-sm">
                                    No pudimos procesar tu pago. Por favor, intenta nuevamente o contacta al complejo.
                                </p>
                            </div>
                        )}

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-gray-300 text-sm font-medium">Disponible para Reserva</span>
                        </div>

                        <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[1.1]">
                            {currentComplex.name}
                        </h2>

                        <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
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
                <section id="canchas" className="py-20 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800">
                    <div className="container">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">
                                    Nuestras Canchas
                                </h3>
                                <p className="text-gray-400">
                                    Selecciona tu campo de juego en {currentComplex.name}.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {fields.map((field: any) => (
                                <FieldCard key={field.id} field={field} />
                            ))}
                            {fields.length === 0 && (
                                <div className="col-span-3 text-center py-20 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
                                    <p className="text-gray-400 text-lg">Este complejo aún no tiene canchas publicadas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <footer className="py-10 border-t border-slate-800 text-center text-gray-600 text-sm">
                    <p>© 2026 Booking Futbol - {currentComplex.name}</p>
                </footer>
            </div>
        </div>
    )
}
