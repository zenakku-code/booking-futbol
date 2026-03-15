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

    return (
        <div className="min-h-screen relative bg-[#050505] overflow-x-hidden">
            {/* Decorative Background - Radial Gradients matching landing */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[#050505]" />
                <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <Link href={`/${slug}`} className="text-gray-400 hover:text-white inline-flex items-center gap-2 transition-colors">
                        ← Volver a {(field as any).complex?.name || 'la página'}
                    </Link>
                    <Link href="/" className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10">
                        Plataforma
                    </Link>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-start mt-6">
                    <div className="animate-fade-in text-white space-y-10">
                        <div>
                            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black mb-8 leading-tight break-words tracking-tighter text-white drop-shadow-2xl">
                                {field.name}
                            </h1>
                            
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                {/* Location Card */}
                                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-3xl px-6 py-4 rounded-3xl border border-white/10 shadow-2xl group transition-all hover:bg-white/10">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xl border border-primary/20">
                                        📍
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">Ubicación del Complejo</span>
                                        <span className="text-sm font-bold text-gray-200">{(field as any).complex?.address || 'Dirección no disponible'}</span>
                                    </div>
                                </div>

                                {/* WhatsApp Official Logo - Side by Side with Location */}
                                {(field as any).complex?.description && (
                                    <a 
                                        href={`https://wa.me/${(field as any).complex.description.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center bg-[#25D366] hover:bg-[#128C7E] text-white w-14 h-14 rounded-full transition-all hover:scale-110 shadow-[0_0_30px_rgba(37,211,102,0.4)] active:scale-95 group relative"
                                        title="Consultas por WhatsApp"
                                    >
                                        <svg 
                                            viewBox="0 0 24 24" 
                                            className="w-8 h-8 fill-current"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <span className="px-5 py-2.5 bg-white/5 backdrop-blur-xl rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 flex items-center gap-2">
                                <span className="text-sm">⚽</span> Fútbol {field.type}
                            </span>
                            <span className="px-5 py-2.5 bg-primary/10 backdrop-blur-xl rounded-2xl text-primary font-black text-[11px] uppercase tracking-[0.2em] border border-primary/20">
                                ${field.price}<span className="opacity-60 ml-1">/HR</span>
                            </span>
                        </div>

                        {field.imageUrl && (
                            <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative group max-w-lg">
                                <img src={field.imageUrl} alt={field.name} className="w-full h-72 object-cover transition-transform duration-1000 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
