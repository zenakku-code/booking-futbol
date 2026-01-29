import { prisma } from "@/lib/prisma"
import BookingFlow from "@/components/client/BookingFlow"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function FieldDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const field = await prisma.field.findUnique({ where: { id } })

    if (!field) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404</h1>
                    <p>Cancha no encontrada</p>
                    <Link href="/" className="text-primary mt-4 inline-block hover:underline">Volver al inicio</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 pb-20 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-b from-primary/20 to-slate-900 -z-0 pointer-events-none" />

            <div className="container pt-10 relative z-10">
                <Link href="/" className="text-gray-400 hover:text-white mb-8 inline-flex items-center gap-2 transition-colors">
                    ← Volver al listado
                </Link>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start mt-6">
                    <div className="animate-fade-in">
                        <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Cancha Profesional</span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight break-words">
                            {field.name}
                        </h1>
                        <div className="flex flex-wrap gap-4 mb-8">
                            <span className="px-4 py-2 bg-slate-800 rounded-lg text-white font-medium border border-slate-700">
                                ⚽ Fútbol {field.type}
                            </span>
                            <span className="px-4 py-2 bg-primary/10 rounded-lg text-primary font-bold border border-primary/20">
                                ${field.price}/hr
                            </span>
                        </div>
                        <p className="text-base md:text-lg text-gray-400 leading-relaxed mb-8">
                            Disfruta de la mejor calidad de césped sintético.
                            Iluminación LED de última generación y vestuarios incluidos.
                            Ideal para torneos o partidos amistosos.
                        </p>
                        {field.imageUrl && (
                            <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
                                <img src={field.imageUrl} alt={field.name} className="w-full object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="mt-8 lg:mt-0">
                        <BookingFlow field={field} />
                    </div>
                </div>
            </div>
        </div>
    )
}
