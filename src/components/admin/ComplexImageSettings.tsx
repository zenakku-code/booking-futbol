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
        <div className="glass p-8 rounded-2xl max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/20 rounded-xl">
                    <span className="text-2xl">🖼️</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Imagen del Complejo</h3>
                    <p className="text-gray-400 text-sm">Sube una foto o pega un link para personalizar tu página.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6 border-t border-slate-700 pt-6">
                <div className="space-y-4">
                    {/* File Upload Option */}
                    <div>
                        <label className="block text-gray-300 font-medium mb-2">Subir desde dispositivo</label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="logo-upload"
                            />
                            <label
                                htmlFor="logo-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-gray-500 group-hover:text-primary"
                            >
                                <span className="text-3xl mb-1">📤</span>
                                <span className="text-sm font-medium">Hacer click para seleccionar foto</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-white/5"></div>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">o usa un link</span>
                        <div className="h-[1px] flex-1 bg-white/5"></div>
                    </div>

                    {/* URL Option */}
                    <div>
                        <input
                            type="url"
                            placeholder="https://ejemplo.com/logo.jpg"
                            className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                        />
                    </div>
                </div>

                {logoUrl && (
                    <div className="relative group aspect-video w-full rounded-2xl overflow-hidden bg-slate-800 border border-white/5">
                        <img
                            src={logoUrl}
                            alt="Vista previa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e293b/FFFFFF?text=URL+Invalida'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                        >
                            <span className="text-xs">✕</span>
                        </button>
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-bold uppercase tracking-widest">
                            {logoUrl.startsWith('data:') ? 'Foto Local' : 'Link Web'}
                        </div>
                    </div>
                )}

                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full py-3 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </form>
        </div>
    )
}
