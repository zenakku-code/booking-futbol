'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ComplexImageSettings({ initialComplex }: { initialComplex: any }) {
    const [logoUrl, setLogoUrl] = useState(initialComplex.logoUrl || '')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const router = useRouter()

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
                    <p className="text-gray-400 text-sm">Esta imagen aparecerá en el directorio y en tu página principal.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6 border-t border-slate-700 pt-6">
                <div>
                    <label className="block text-gray-300 font-medium mb-2">URL de la Imagen</label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            placeholder="https://ejemplo.com/mi-logo.jpg"
                            className="flex-1 p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        💡 Tip: Puedes usar links de Unsplash, Imgur o cualquier URL pública.
                    </p>
                </div>

                {logoUrl && (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-800 border border-white/5">
                        <img
                            src={logoUrl}
                            alt="Vista previa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e293b/FFFFFF?text=Error+al+cargar+imagen'
                            }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-bold uppercase tracking-widest">
                            Vista Previa
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
