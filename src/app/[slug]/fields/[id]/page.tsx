import { prisma } from "@/lib/prisma"
import BookingFlow from "@/components/client/BookingFlow"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function FieldDetailPage({
    params
}: {
    params: Promise<{ slug: string, id: string }>
}) {
    const { slug, id } = await params

    const field = await prisma.field.findUnique({
        where: { id },
        include: { complex: true }
    })

    if (!field || (field as any).complex?.slug !== slug) {
        notFound()
    }

    // Force-fetch settings to ensure freshness and avoid inclusion bugs
    let complexSettings = null
    try {
        complexSettings = await (prisma as any).complex.findUnique({
            where: { id: (field as any).complexId },
            select: { downPaymentEnabled: true, downPaymentFixed: true }
        })
        console.log(`[SERVER] Independent complex fetch SUCCESS:`, complexSettings)
    } catch (e) {
        console.error(`[SERVER] Independent complex fetch FAILED:`, e)
        // Fallback to included complex if available
        if ((field as any).complex) {
            console.log(`[SERVER] Fallback to included complex:`, (field as any).complex)
            complexSettings = {
                downPaymentEnabled: (field as any).complex.downPaymentEnabled,
                downPaymentFixed: (field as any).complex.downPaymentFixed
            }
        }
    }

    const serverHasDeposit = Boolean(
        (complexSettings?.downPaymentEnabled) &&
        (Number(complexSettings?.downPaymentFixed || 0) > 0) &&
        (Number(complexSettings?.downPaymentFixed || 0) < Number(field.price))
    )

    console.log(`[SERVER] FINAL DECISION - serverHasDeposit: ${serverHasDeposit}`, {
        enabled: complexSettings?.downPaymentEnabled,
        fixed: complexSettings?.downPaymentFixed,
        price: field.price
    })

    const inventory = await (prisma as any).inventoryItem.findMany({
        where: { complexId: (field as any).complexId }
    })

    // Pass everything explicitly
    return (
        <div className="min-h-screen relative bg-slate-900">
            {/* Decorative Background */}
            <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-b from-primary/20 to-slate-900 -z-0 pointer-events-none" />

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <Link href={`/${slug}`} className="text-gray-400 hover:text-white inline-flex items-center gap-2 transition-colors">
                        ← Volver a {(field as any).complex?.name || 'la página'}
                    </Link>
                    <Link href="/" className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10">
                        Plataforma
                    </Link>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start mt-6">
                    <div className="animate-fade-in text-white">
                        <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Cancha Profesional</span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight break-words">
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
                        </p>
                        {field.imageUrl && (
                            <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                                <img src={field.imageUrl} alt={field.name} className="w-full object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="mt-8 lg:mt-0 w-full overflow-hidden">
                        <BookingFlow
                            field={{
                                ...field,
                                price: Number(field.price),
                                complexId: (field as any).complexId,
                                // complex: undefined, // Removed entirely to clean up object
                                availableDays: field.availableDays || undefined,
                                openTime: field.openTime || undefined,
                                closeTime: field.closeTime || undefined
                            } as any}
                            // Clean inventory prices too
                            inventory={inventory.map((i: any) => ({ ...i, price: Number(i.price) }))}
                            paymentSettings={{
                                downPaymentEnabled: complexSettings?.downPaymentEnabled || false,
                                downPaymentFixed: Number(complexSettings?.downPaymentFixed || 0)
                            }}
                            serverHasDeposit={serverHasDeposit}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
