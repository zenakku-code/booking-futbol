'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import SubscriptionCheck from '@/components/admin/SubscriptionCheck'

import { signOut, useSession } from '@/lib/auth-client'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    const isLoginPage = pathname === '/admin/login'

    const [userRole, setUserRole] = useState('')
    const { data: sessionData } = useSession()

    const handleLogout = async () => {
        try {
            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        router.push('/admin/login')
                        router.refresh()
                    }
                }
            })
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const [hasAccess, setHasAccess] = useState(true)

    useEffect(() => {
        if (sessionData?.user) {
            setUserRole((sessionData.user as any).role)
        }

        // Check subscription access for UI blocking
        const checkAccess = async () => {
            try {
                const res = await fetch('/api/subscription/status')
                const data = await res.json()
                // Default to true if api fails to avoid accidental lockout, unless explicit false
                setHasAccess(data.hasAccess !== false)
            } catch (e) {
                console.error('Failed to check access', e)
            }
        }
        checkAccess()
    }, [])


    if (isLoginPage) {
        return <>{children}</>
    }


    return (
        <div className="min-h-screen flex bg-[#050505] relative text-white">
            <SubscriptionCheck />
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full z-50 glass rounded-none border-x-0 border-t-0 border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <span className="font-black text-white text-xl tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    TIKI
                    <span className="text-primary italic">TAKA</span>
                    <span className="text-[10px] ml-2 text-primary/80 font-bold tracking-[0.2em] uppercase align-middle">Admin</span>
                </span>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-white p-2">
                    ☰
                </button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-0 h-[100dvh] w-72 bg-[#0a0a0a]/95 backdrop-blur-3xl border-r border-white/5 p-6 flex flex-col gap-8 z-50 transition-transform duration-300 ease-in-out overflow-y-auto custom-scrollbar shadow-[10px_0_50px_rgba(0,0,0,0.5)]
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex items-center gap-3 px-2 group cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#111] to-[#050505] border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all">
                        <span className="text-xl">⚽</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">TIKI<span className="text-primary italic">TAKA</span></h1>
                        <span className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">Admin Pro</span>
                    </div>
                </div>

                <nav className="flex flex-col gap-2">
                    {userRole === 'SUPERADMIN' && (
                        <div className="mb-2 pb-2 border-b border-white/5">
                            <NavLink href="/saas-admin" icon="👑" onClick={() => setSidebarOpen(false)}>
                                <span className="text-indigo-400 font-bold">Panel Super Admin</span>
                            </NavLink>
                        </div>
                    )}

                    {/* Main Navigation - Conditional Access */}
                    <div className={`space-y-2 transition-opacity duration-300 ${!hasAccess ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <NavLink href="/admin" icon="📊" onClick={() => setSidebarOpen(false)}>Dashboard</NavLink>
                        <NavLink href="/admin/bookings" icon="📅" onClick={() => setSidebarOpen(false)}>Reservas</NavLink>
                        <NavLink href="/admin/reports" icon="📈" onClick={() => setSidebarOpen(false)}>Reportes</NavLink>
                        <NavLink href="/admin/fields" icon="🏟️" onClick={() => setSidebarOpen(false)}>Canchas</NavLink>
                        <NavLink href="/admin/inventory" icon="🎒" onClick={() => setSidebarOpen(false)}>Inventario</NavLink>
                        <NavLink href="/admin/settings" icon="⚙️" onClick={() => setSidebarOpen(false)}>Configuración</NavLink>
                    </div>

                    {!hasAccess && (
                        <div className="mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-center relative">
                            <span className="absolute right-2 top-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">ACCESO RESTRINGIDO</p>
                            <p className="text-[10px] text-gray-400">Tu suscripción ha vencido. Renueva para gestionar tu complejo.</p>
                        </div>
                    )}

                    {/* Subscription Section - ALWAYS ACTIVE */}
                    <div className="mt-2 pt-2 border-t border-white/5 relative">
                        <NavLink href="/admin/subscription" icon="💳" onClick={() => setSidebarOpen(false)}>
                            <span className="text-primary font-semibold">Suscripción</span>
                        </NavLink>
                    </div>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">A</div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">Administrador</p>
                            <p className="text-xs text-green-400">● En línea</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold transition-all border border-red-500/20 flex items-center justify-center gap-2"
                    >
                        <span>🚪</span> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 w-full overflow-x-hidden md:ml-0 pt-24 md:pt-0">
                <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
                    {children}
                </div>
            </main>
        </div >
    )
}

function NavLink({ href, children, icon, onClick }: { href: string; children: React.ReactNode; icon: string; onClick?: () => void }) {
    const pathname = usePathname()
    const isActive = href === '/admin' ? pathname === href : pathname?.startsWith(href)

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`
                px-4 py-3.5 rounded-xl transition-all duration-300 font-medium flex items-center gap-3 group relative overflow-hidden
                ${isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}
            `}
        >
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary drop-shadow-[0_0_5px_rgba(16,185,129,0.8)] rounded-r-full"></div>}
            <span className={`text-xl ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'group-hover:scale-110'} transition-transform z-10 relative`}>{icon}</span>
            <span className="relative z-10 tracking-wide text-sm font-semibold">{children}</span>
        </Link>
    )
}
