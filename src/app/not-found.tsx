import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <h1 className="text-8xl font-black text-primary mb-4">404</h1>
                <h2 className="text-2xl font-bold text-white mb-4">Página no encontrada</h2>
                <p className="text-gray-400 mb-8">La página que buscás no existe o fue movida.</p>
                <Link href="/" className="btn btn-primary px-8 py-3 font-bold">
                    Volver al inicio
                </Link>
            </div>
        </div>
    )
}
