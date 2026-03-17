'use client'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export default function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        if (newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres')
            return
        }

        setIsLoading(true)
        try {
            const { error: authError } = await authClient.changePassword({
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            })

            if (authError) {
                setError(authError.message || 'Error al cambiar la contraseña')
            } else {
                setSuccess(true)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            }
        } catch (err: any) {
            setError('Ocurrió un error inesperado')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="glass-card p-8 border border-white/[0.03]">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-xl shadow-inner border border-blue-500/20">
                    🔒
                </div>
                <div>
                    <h3 className="text-white font-black text-xl tracking-tight">Cambiar Contraseña</h3>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Seguridad de la cuenta</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-fade-in">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm animate-fade-in">
                        ✓ Contraseña cambiada con éxito
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Contraseña Actual</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full p-4 bg-black/20 border border-white/5 rounded-full text-white outline-none focus:border-primary/50 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Nueva Contraseña</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full p-4 bg-black/20 border border-white/5 rounded-full text-white outline-none focus:border-primary/50 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Confirmar Nueva Contraseña</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full p-4 bg-black/20 border border-white/5 rounded-full text-white outline-none focus:border-primary/50 transition-all"
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary px-10 py-4 text-xs font-black uppercase tracking-[0.2em] disabled:opacity-30 transition-all shadow-xl shadow-primary/10"
                    >
                        {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                    </button>
                </div>
            </form>
        </div>
    )
}
