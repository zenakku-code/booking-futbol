'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type ApiKey = {
    id: string
    name: string
    key: string
    createdAt: string
    lastUsed: string | null
}

export default function ApiKeySettings() {
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchKeys()
    }, [])

    const fetchKeys = async () => {
        try {
            const res = await fetch('/api/admin/apikeys')
            const data = await res.json()
            if (data.success) {
                setKeys(data.keys)
            }
        } catch (e) {
            console.error('Failed to fetch keys')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) return

        setIsCreating(true)
        try {
            const res = await fetch('/api/admin/apikeys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            })
            const data = await res.json()

            if (data.success) {
                setNewlyCreatedKey(data.key.key)
                setKeys([data.key, ...keys]) // Add to list (will be masked on refresh but fine for now)
                setNewKeyName('')
            }
        } catch (e) {
            alert('Error creating key')
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteKey = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta API Key? Cualquier integración que la use dejará de funcionar.')) return

        try {
            const res = await fetch(`/api/admin/apikeys/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setKeys(keys.filter(k => k.id !== id))
            }
        } catch (e) {
            alert('Error deleting key')
        }
    }

    return (
        <div className="glass p-6 rounded-full">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span>🔑</span> API Access
            </h3>
            <p className="text-gray-400 text-sm mb-6">
                Genera claves API para integrar tu complejo con servicios externos o desarrollar tus propias herramientas.
            </p>

            {/* New Key Form */}
            <div className="flex gap-2 mb-8">
                <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Nombre (ej: Website Bot)"
                    className="flex-1 p-3 bg-slate-900/50 border border-white/10 rounded-full text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
                <button
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim() || isCreating}
                    className="btn btn-primary py-2 px-4 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    {isCreating ? 'Creando...' : 'Crear Key'}
                </button>
            </div>

            {/* Success Message showing full key */}
            {newlyCreatedKey && (
                <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-xl animate-fade-in">
                    <p className="text-green-400 font-bold mb-2">¡API Key Creada!</p>
                    <p className="text-sm text-gray-300 mb-2">Copia esta clave ahora. No podrás verla nuevamente.</p>
                    <div className="flex items-center gap-2">
                        <code className="bg-black/30 px-3 py-2 rounded-lg text-green-300 font-mono text-sm flex-1 break-all">
                            {newlyCreatedKey}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(newlyCreatedKey)
                                alert('Copiado!')
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            📋
                        </button>
                    </div>
                    <button
                        onClick={() => setNewlyCreatedKey(null)}
                        className="text-xs text-gray-500 mt-4 hover:text-white underline"
                    >
                        Cerrar
                    </button>
                </div>
            )}

            {/* Keys List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center py-4 text-gray-500">Cargando...</div>
                ) : keys.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-white/5">
                        <p className="text-gray-500 text-sm">No tienes API Keys activas.</p>
                    </div>
                ) : (
                    keys.map(key => (
                        <div key={key.id} className="flex items-center justify-between p-4 bg-slate-900/30 border border-white/5 rounded-xl hover:border-white/10 transition-all group">
                            <div>
                                <p className="text-white font-bold text-sm">{key.name}</p>
                                <p className="text-xs text-gray-500 font-mono mt-1">
                                    {key.key.startsWith('sk_') ? (
                                        // Show masked if it's from the list fetch, or full if it's the optimistic update (though strictly we should mask it here too unless it's the special 'newlyCreated' block)
                                        // Actually the fetch returns masked. The optimistic add puts full key. 
                                        // Logic: if it equals newlyCreatedKey, show full? No, separate block handles full exposure.
                                        // Let's just mask it always here.
                                        key.key.substring(0, 12) + '...'
                                    ) : (
                                        key.key
                                    )}
                                </p>
                                <p className="text-[10px] text-gray-600 mt-1">
                                    Creada: {new Date(key.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDeleteKey(key.id)}
                                className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold px-3 py-1.5 hover:bg-red-500/10 rounded-lg"
                            >
                                Revocar
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
