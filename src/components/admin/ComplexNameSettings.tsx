'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
    initialComplex: {
        id: string
        name: string
        slug: string
    } | null
}

export default function ComplexNameSettings({ initialComplex }: Props) {
    const [name, setName] = useState(initialComplex?.name || '')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()

    const handleSave = async () => {
        if (!name.trim()) {
            setMessage('El nombre no puede estar vacío')
            return
        }

        setIsLoading(true)
        setMessage('')

        try {
            const res = await fetch('/api/admin/complex', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() })
            })

            if (res.ok) {
                setMessage('✓ Nombre actualizado correctamente')
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
            <h3 className="text-white font-bold text-lg mb-4">Nombre del Complejo</h3>

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
                    <p className="text-gray-500 text-xs mt-2">
                        Este es el nombre que verán tus clientes. La URL de tu complejo <span className="text-primary font-mono">/{initialComplex.slug}</span> no cambiará.
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={handleSave}
                        disabled={isLoading || name === initialComplex.name}
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
    )
}
