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
        <div className="glass p-6 rounded-2xl">
            <h3 className="text-white font-bold text-lg mb-4">Información del Complejo</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-sm mb-2">Nombre Visible</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="Ej: La Bombonera"
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-2">Dirección Exacta</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="Ej: Av. del Libertador 1234, CABA"
                    />
                    <p className="text-gray-500 text-xs mt-2">Aparecerá en tu tarjeta pública.</p>
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-2">Descripción / Eslogan</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all min-h-[100px]"
                        placeholder="Ej: Canchas profesionales con la mejor iluminación LED de la zona."
                    />
                    <p className="text-gray-500 text-xs mt-2">Describe las prestaciones de tu complejo.</p>
                </div>

                <div className="pt-2">
                    <p className="text-gray-500 text-xs mb-4">
                        Tu URL: <span className="text-primary font-mono">/{initialComplex.slug}</span>
                    </p>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleSave}
                            disabled={isLoading || !hasChanges}
                            className="btn btn-primary px-6 py-2 disabled:opacity-50"
                        >
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        {message && (
                            <span className={`text-sm ${message.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                                {message}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
