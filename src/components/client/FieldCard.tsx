import Link from 'next/link'

export default function FieldCard({ field }: { field: any }) {
    return (
        <Link href={`/${field.complex?.slug || 'error'}/fields/${field.id}`} className="block group w-full h-full">
            <div className="glass-card flex flex-col overflow-hidden relative transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-2xl hover:shadow-primary/20 h-full">
                {/* Image Section - Fixed Aspect Ratio */}
                <div className="relative w-full pt-[60%] bg-slate-800 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                        {field.imageUrl ? (
                            <img
                                src={field.imageUrl}
                                alt={field.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 group-hover:from-slate-800 group-hover:to-primary/20 transition-colors">
                                <span className="text-6xl filter drop-shadow-lg opacity-80 group-hover:scale-110 transition-transform duration-300">⚽</span>
                            </div>
                        )}
                    </div>

                    {/* Badge */}
                    <div className="absolute top-4 right-4 z-20">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 shadow-lg">
                            Fútbol {field.type}
                        </span>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col relative z-20 bg-gradient-to-b from-slate-900/50 to-transparent">
                    <div className="mb-4">
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">{field.name}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">
                            Cancha profesional de césped sintético. Iluminación LED y vestuarios incluidos.
                        </p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Valor por hora</span>
                            <span className="text-xl font-bold text-primary">${field.price}</span>
                        </div>
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 group-hover:bg-primary group-hover:text-black transition-all duration-300 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l6 6m0 0l-6 6m6-6H3" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
