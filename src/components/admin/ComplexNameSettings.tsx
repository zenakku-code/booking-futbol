'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
    initialComplex: {
        id: string
        name: string
        address?: string | null
        description?: string | null
        slug: string
    } | null
}

export default function ComplexNameSettings({ initialComplex }: Props) {
    const [name, setName] = useState(initialComplex?.name || '')
    const [address, setAddress] = useState(initialComplex?.address || '')
    const [description, setDescription] = useState(initialComplex?.description || '')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()

    const hasChanges = 
        name !== initialComplex?.name || 
        address !== (initialComplex?.address || '') || 
        description !== (initialComplex?.description || '')

    const handleSave = async () => {
        if (!name.trim()) {
            setMessage('El nombre no puede estar vacío')
            return
        }

        setIsLoading(true)
        setMessage('')

        try {
            const res = await fetch('/api/admin/complex', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: name.trim(),
                    address: address.trim(),
                    description: description.trim()
                })
            })

            if (res.ok) {
                setMessage('✓ Información actualizada correctamente')
                router.refresh()
            } else {
                setMessage('Error al actualizar')
            }
        } catch (e) {
            setMessage('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    if (!initialComplex) return null

    return (
        <div className="glass-card p-8 border border-white/[0.03]">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl shadow-inner border border-primary/20">
                    🏢
                </div>
                <div>
                    <h3 className="text-white font-black text-xl tracking-tight">Información del Complejo</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">Datos públicos de tu negocio</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="group">
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1">Nombre Visible</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-4 bg-black/20 border border-white/5 rounded-full text-white font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-gray-700"
                        placeholder="Ej: La Bombonera"
                    />
                </div>

                <div className="group">
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1">Dirección Exacta</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-4 bg-black/20 border border-white/5 rounded-full text-white font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-gray-700"
                        placeholder="Ej: Av. del Libertador 1234, CABA"
                    />
                    <p className="text-gray-600 text-[10px] font-bold mt-2.5 flex items-center gap-1.5 ml-1">
                        <span className="text-primary/50">ℹ</span> Aparecerá en tu tarjeta pública para tus clientes.
                    </p>
                </div>

                <div className="group lg:col-span-2">
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1">WhatsApp de contacto (Solo números)</label>
                    <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl z-10">
                            📱
                        </div>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-4 pl-16 bg-black/20 border border-white/5 rounded-full text-white font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-gray-700"
                            placeholder="Ej: 5491122334455"
                        />
                    </div>
                    <p className="text-gray-600 text-[10px] font-bold mt-2.5 flex items-center gap-1.5 ml-1">
                        ℹ️ Ingresa el número con código de área (ej: 549...). Tus clientes podrán contactarte directamente.
                    </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                    <div className="bg-white/[0.02] p-4 rounded-full border border-white/[0.05] mb-6 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tu URL Pública</span>
                        <span className="text-primary font-black text-xs tracking-tight">tikitaka.com/{initialComplex.slug}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                            onClick={handleSave}
                            disabled={isLoading || !hasChanges}
                            className="btn-primary w-full sm:w-auto px-10 py-4 text-xs font-black uppercase tracking-[0.2em] disabled:opacity-30 disabled:grayscale transition-all"
                        >
                            {isLoading ? 'Procesando...' : 'Guardar Cambios'}
                        </button>
                        
                        {message && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest ${message.startsWith('✓') ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' : 'text-red-400 bg-red-500/5 border border-red-500/10'}`}>
                                {message.startsWith('✓') ? '✓' : '⚠'} {message.replace('✓ ', '')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
