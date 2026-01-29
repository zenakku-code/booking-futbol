import { prisma } from "@/lib/prisma"
import FieldCard from "@/components/client/FieldCard"
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ complex?: string }> }) {
    const { complex: slug } = await searchParams

    let whereClause = {}
    let currentComplex = null

    if (slug) {
        currentComplex = await prisma.complex.findUnique({
            where: { slug }
        })
        if (currentComplex) {
            whereClause = { complexId: currentComplex.id }
        }
    }

    const fields = await prisma.field.findMany({
        where: whereClause,
        include: { complex: true },
        orderBy: { type: 'asc' }
    })

    return (
        <div className="min-h-screen bg-[url('/bg-hero.jpg')] bg-cover bg-fixed relative">
            <div className="absolute inset-0 bg-slate-900/90 z-0" />

            <div className="relative z-10">
                {/* Header */}
                <header className="absolute top-0 w-full p-6">
                    <div className="container flex justify-between items-center">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            Booking Futbol
                        </h1>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="min-h-[80vh] flex items-center justify-center text-center px-4 pt-20 relative overflow-hidden">
                    {/* Background Blobs */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] -z-10 animate-float" style={{ animationDelay: '2s' }} />

                    <div className="max-w-4xl animate-fade-in z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-gray-300 text-sm font-medium">Disponible 24/7</span>
                        </div>

                        <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[1.1]">
                            Reserva tu <br />
                            <span className="text-gradient">momento de gloria.</span>
                        </h2>

                        <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Canchas premium de césped sintético. Iluminación LED.
                            La mejor experiencia de fútbol 5, 7 y 11.
                        </p>

                        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                            <a href="#canchas" className="btn btn-primary text-lg px-10 py-4 rounded-full shadow-[0_0_40px_-10px_rgba(74,222,128,0.5)] hover:scale-105 transition-transform">
                                Reservar Ahora
                            </a>
                            <Link href="/contact" className="px-8 py-4 rounded-full text-white font-medium hover:bg-white/5 transition-colors">
                                Contactar Soporte
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Fields Grid */}
                <section id="canchas" className="py-20 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800">
                    <div className="container">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">Nuestras Canchas</h3>
                                <p className="text-gray-400">Selecciona tu campo de juego ideal.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {fields.map((field) => (
                                <FieldCard key={field.id} field={field} />
                            ))}
                            {fields.length === 0 && (
                                <div className="col-span-3 text-center py-20 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
                                    <p className="text-gray-400 text-lg">No hay canchas disponibles por el momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <footer className="py-10 border-t border-slate-800 text-center text-gray-600 text-sm">
                    <p>© 2026 Booking Futbol - Created with Vercel & Next.js</p>
                </footer>
            </div>
        </div>
    )
}
