'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ComplexImageSettings({ initialComplex }: { initialComplex: any }) {
    const [logoUrl, setLogoUrl] = useState(initialComplex.logoUrl || '')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // 2MB Limit for Base64 (to avoid DB/payload issues in MVP)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'La imagen es muy pesada (máx 2MB)' })
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setLogoUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage({ type: '', text: '' })

        try {
            const res = await fetch('/api/admin/complex', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logoUrl })
            })

            if (res.ok) {
                setMessage({ type: 'success', text: 'Imagen actualizada correctamente' })
                router.refresh()
            } else {
                const data = await res.json()
                setMessage({ type: 'error', text: data.error || 'Error al actualizar' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de red' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="glass-card p-8 border border-white/[0.03]">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-xl shadow-inner border border-indigo-500/20">
                    🖼️
                </div>
                <div>
                    <h3 className="text-white font-black text-xl tracking-tight">Logo del Complejo</h3>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Define tu identidad visual</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="space-y-6">
                    {/* File Upload Zone */}
                    <div className="group relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="logo-upload"
                        />
                        <label
                            htmlFor="logo-upload"
                            className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-white/5 rounded-full cursor-pointer bg-white/[0.01] hover:bg-primary/5 hover:border-primary/30 transition-all duration-500 text-gray-500 group-hover:text-primary relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-4xl mb-3 transform group-hover:scale-110 group-hover:-translate-y-1 transition-all">📤</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Subir desde dispositivo</span>
                            <span className="text-[9px] text-gray-600 font-bold mt-2 uppercase tracking-widest">(JPG, PNG, WEBP - Max 2MB)</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="h-[1px] flex-1 bg-white/5"></div>
                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">o usa un link externo</span>
                        <div className="h-[1px] flex-1 bg-white/5"></div>
                    </div>

                    {/* URL Input */}
                    <div className="group">
                        <input
                            type="url"
                            placeholder="https://tu-imagen.com/logo.jpg"
                            className="w-full p-4 bg-black/20 border border-white/5 rounded-full text-white font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-gray-700 text-sm"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                        />
                    </div>
                </div>

                {logoUrl && (
                    <div className="space-y-3">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Vista Previa</div>
                        <div className="relative group aspect-video sm:aspect-auto sm:h-52 w-full rounded-full overflow-hidden bg-black/20 border border-white/10 shadow-2xl">
                            <img
                                src={logoUrl}
                                alt="Vista previa"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/111/333?text=URL+Invalida'
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                            
                            <button
                                type="button"
                                onClick={() => setLogoUrl('')}
                                className="absolute top-4 right-4 p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-all shadow-2xl backdrop-blur-md active:scale-90"
                            >
                                <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">Eliminar ✕</span>
                            </button>
                            
                            <div className="absolute bottom-4 left-6 flex items-center gap-2">
                                <div className="px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-[9px] text-white font-black uppercase tracking-widest shadow-xl">
                                    {logoUrl.startsWith('data:') ? '✅ Archivo Local' : '🌐 Link Externo'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-6 border-t border-white/5">
                    {message.text && (
                        <div className={`p-4 rounded-full text-[11px] font-black uppercase tracking-widest mb-6 ${message.type === 'success' ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'bg-red-500/5 text-red-100 border border-red-500/10'
                            }`}>
                            {message.type === 'success' ? '✓' : '⚠'} {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-4 rounded-full font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-30"
                    >
                        {isLoading ? 'Sincronizando...' : 'Publicar Logo'}
                    </button>
                </div>
            </form>
        </div>
    )
}
