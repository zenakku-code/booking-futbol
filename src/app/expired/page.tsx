import Link from 'next/link'

export default function ExpiredSubscriptionPage() {
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full glass p-8 rounded-2xl border border-red-500/20 shadow-lg shadow-red-500/10 animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/5"></div>

                <div className="relative z-10">
                    <div className="text-6xl mb-6">⚠️</div>
                    <h1 className="text-3xl font-bold text-white mb-4">Suscripción Vencida</h1>
                    <p className="text-gray-400 mb-8">
                        Tu periodo de prueba ha finalizado o tu cuenta ha sido suspendida.
                        Para continuar gestionando tus reservas, por favor actualiza tu plan.
                    </p>

                    <div className="space-y-4">
                        <a
                            href="https://wa.me/5491112345678"
                            target="_blank"
                            className="block w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                        >
                            Contactar Soporte
                        </a>
                        <Link
                            href="/admin/login"
                            className="block w-full py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Volver al Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
