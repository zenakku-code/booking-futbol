'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    LayoutDashboard, 
    Building2, 
    Megaphone, 
    History, 
    DollarSign, 
    TrendingUp, 
    Users, 
    PlusCircle,
    Search,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    LogOut,
    ExternalLink,
    Info,
    Trash2
} from 'lucide-react'

// --- Types ---
type ComplexStats = {
    bookings: number,
    users: number,
    revenue: number
}

type Complex = {
    id: string
    name: string
    slug: string
    createdAt: string
    trialEndsAt: string | null
    subscriptionActive: boolean
    isActive: boolean
    stats?: ComplexStats
    users?: { id: string, email: string }[]
}

type Notification = {
    id: string
    title: string
    message: string
    type: string
    active: boolean
    createdAt: string
}

type AuditLog = {
    id: string
    action: string
    details: string
    userId: string
    createdAt: string
}

// --- Main Component ---
export default function SuperAdminDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'complexes' | 'broadcasts' | 'audit'>('overview')
    const [complexes, setComplexes] = useState<Complex[]>([])
    const [stats, setStats] = useState<any>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [prices, setPrices] = useState({ monthly: 10000, quarterly: 27000, annual: 100000 })
    const [savingPrices, setSavingPrices] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [modal, setModal] = useState<{ 
        isOpen: boolean, 
        title: string, 
        type: 'confirm' | 'form',
        content?: React.ReactNode,
        onConfirm?: (data?: any) => void
    }>({ isOpen: false, title: '', type: 'confirm' })
    
    const router = useRouter()

    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        setRefreshing(true)
        try {
            const [compRes, statsRes, notifRes, auditRes, settingsRes] = await Promise.all([
                fetch('/api/saas/complexes'),
                fetch('/api/saas/stats'),
                fetch('/api/saas/notifications'),
                fetch('/api/saas/audit'),
                fetch('/api/saas/settings')
            ])

            if (compRes.status === 401) {
                router.push('/admin/login')
                return
            }

            const [cData, sData, nData, aData, settsData] = await Promise.all([
                compRes.json(),
                statsRes.json(),
                notifRes.json(),
                auditRes.json(),
                settsDataRes(settingsRes)
            ])

            setComplexes(Array.isArray(cData) ? cData : [])
            setStats(sData)
            setNotifications(Array.isArray(nData) ? nData : [])
            setAuditLogs(Array.isArray(aData) ? aData : [])
            if (settsData) setPrices({
                monthly: settsData.monthlyPrice || 10000,
                quarterly: settsData.quarterlyPrice || 27000,
                annual: settsData.annualPrice || 100000
            })
        } catch (e) {
            console.error('Failed to fetch data', e)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const settsDataRes = async (res: Response) => {
        if (res.ok) return await res.json()
        return null
    }

    const handleCreateComplex = async (name: string) => {
        if (!name) return
        
        setRefreshing(true)
        try {
            const res = await fetch('/api/saas/complexes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            if (res.ok) {
                const data = await res.json()
                setModal({ 
                    isOpen: true, 
                    title: '¡Éxito! 🎉', 
                    type: 'confirm',
                    content: (
                        <div className="space-y-4">
                            <p className="text-emerald-400 text-sm font-bold">El complejo ha sido creado exitosamente.</p>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nombre</p>
                                <p className="text-white font-bold">{data.name}</p>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-3 mb-1">URL / Slug</p>
                                <p className="text-indigo-400 font-mono text-xs">{data.slug}</p>
                            </div>
                        </div>
                    ),
                    onConfirm: () => setModal({ ...modal, isOpen: false })
                })
                fetchAllData()
            } else {
                const err = await res.json()
                alert(err.error || 'Fallo al crear')
            }
        } catch (e) {
            alert('Error de red')
        } finally {
            setRefreshing(false)
        }
    }

    const openCreateModal = () => {
        setModal({
            isOpen: true,
            title: 'Crear Nuevo Complejo',
            type: 'form',
            content: (
                <div className="space-y-4">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                        Ingresa el nombre de la institución. El sistema generará automáticamente una URL única basada en este nombre.
                    </p>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nombre del Complejo</label>
                        <input 
                            id="new-complex-name"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none" 
                            placeholder="Ej: La Masía Fútbol" 
                        />
                    </div>
                </div>
            ),
            onConfirm: () => {
                const name = (document.getElementById('new-complex-name') as HTMLInputElement)?.value
                handleCreateComplex(name)
            }
        })
    }

    const handleImpersonate = async (userId: string) => {
        setModal({
            isOpen: true,
            title: 'Modo Soporte 🛡️',
            type: 'confirm',
            content: (
                <div className="space-y-3">
                    <p className="text-gray-300 text-sm">¿Deseas ingresar al panel de este usuario? Serás redirigido al dashboard con su sesión activa.</p>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 p-2 rounded-lg inline-block">Tu acción quedará registrada en el log de auditoría.</p>
                </div>
            ),
            onConfirm: async () => {
                try {
                    const res = await fetch('/api/saas/impersonate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId })
                    })
                    if (res.ok) {
                        window.location.href = '/admin'
                    } else {
                        alert('Fallo al impersonar')
                    }
                } catch (e) {
                    alert('Error de red')
                }
            }
        })
    }

    const handleExtendTrial = async (complexId: string) => {
        setModal({
            isOpen: true,
            title: 'Extender Trial ⏳',
            type: 'confirm',
            content: (
                <p className="text-gray-300 text-sm">Esto agregará exactamente 7 días de acceso Premium (Trial) a este complejo. ¿Confirmas la acción?</p>
            ),
            onConfirm: async () => {
                setRefreshing(true)
                try {
                    const res = await fetch('/api/saas/complexes', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ complexId, action: 'EXTEND_TRIAL' })
                    })
                    if (res.ok) {
                        const updated = await res.json()
                        setModal({ 
                            isOpen: true, 
                            title: 'Trial Extendido! ⏳🎉', 
                            type: 'confirm',
                            content: (
                                <div className="space-y-4">
                                    <p className="text-emerald-400 text-sm font-bold">Se han acreditado 7 días adicionales exitosamente.</p>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nueva Fecha de Expiración</p>
                                        <p className="text-white font-bold">{new Date(updated.trialEndsAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ),
                            onConfirm: () => setModal({ ...modal, isOpen: false })
                        })
                        fetchAllData()
                    }
                } catch (e) {
                    alert('Error')
                } finally {
                    setRefreshing(false)
                }
            }
        })
    }

    const handleDeleteComplex = async (complexId: string, complexName: string) => {
        setModal({
            isOpen: true,
            title: '¿Confirmar Eliminación? ⚠️',
            type: 'confirm',
            content: (
                <div className="space-y-4">
                    <p className="text-red-400 text-sm font-bold">¡ADVERTENCIA CRÍTICA!</p>
                    <p className="text-gray-300 text-xs leading-relaxed">
                        Estás a punto de eliminar permanentemente el complejo <span className="text-white font-bold">{complexName}</span>. 
                        Esta acción borrará:
                    </p>
                    <ul className="text-[10px] text-gray-500 space-y-1 list-disc pl-4 uppercase font-black tracking-widest">
                        <li>Todas las canchas (fields)</li>
                        <li>Todas las reservas e ingresos</li>
                        <li>Todos los usuarios del complejo</li>
                        <li>Configuración y suscripción</li>
                    </ul>
                    <p className="text-[10px] text-red-500/80 font-black uppercase tracking-tighter bg-red-500/10 p-2 rounded-lg">
                        ESTA ACCIÓN NO SE PUEDE DESHACER.
                    </p>
                </div>
            ),
            onConfirm: async () => {
                setRefreshing(true)
                try {
                    const res = await fetch('/api/saas/complexes', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ complexId, action: 'DELETE_COMPLEX' })
                    })
                    if (res.ok) {
                        setModal({ 
                            isOpen: true, 
                            title: 'Eliminado Correctamente', 
                            type: 'confirm',
                            content: <p className="text-gray-400 text-sm">El complejo ha sido borrado del sistema.</p>,
                            onConfirm: () => setModal({ ...modal, isOpen: false })
                        })
                        fetchAllData()
                    } else {
                        alert('Fallo al eliminar')
                    }
                } catch (e) {
                    alert('Error de red')
                } finally {
                    setRefreshing(false)
                }
            }
        })
    }

    const handleViewComplex = (c: Complex) => {
        setModal({
            isOpen: true,
            title: `Detalles: ${c.name}`,
            type: 'confirm',
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">ID Único</p>
                                <p className="text-xs font-mono text-gray-300 break-all">{c.id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nombre Completo</p>
                                <p className="text-sm font-bold text-white">{c.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Ruta (Slug)</p>
                                <p className="text-sm font-bold text-indigo-400">/{c.slug}</p>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Estado</p>
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest border ${c.subscriptionActive ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                        {c.subscriptionActive ? 'PREMIUM' : 'FREE / TRIAL'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Activo</p>
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest border ${c.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        {c.isActive ? 'SÍ' : 'NO'}
                                    </span>
                                </div>
                            </div>
                            {c.trialEndsAt && (
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Trial Finaliza</p>
                                    <p className="text-sm font-bold text-amber-500">{new Date(c.trialEndsAt).toLocaleDateString()} ({getTrialDays(c.trialEndsAt)} días restantes)</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Miembro desde</p>
                                <p className="text-sm font-bold text-gray-300">{new Date(c.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Reservas Totales</p>
                                <p className="text-sm font-bold text-white">{c.stats?.bookings || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Facturación</p>
                                <p className="text-sm font-bold text-white">${c.stats?.revenue?.toLocaleString() || 0}</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Acciones Administrativas</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleImpersonate(c.users?.[0]?.id || '')}
                                    disabled={!c.users?.[0]?.id}
                                    className={`flex items-center justify-center gap-2 py-4 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${c.users?.[0]?.id ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/10 opacity-50 cursor-not-allowed'}`}
                                >
                                    <ShieldCheck size={16} /> Soporte
                                </button>
                                <button 
                                    onClick={() => handleExtendTrial(c.id)}
                                    className="flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
                                >
                                    <PlusCircle size={16} /> +7 Días Trial
                                </button>
                                <a 
                                    href={`/${c.slug}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-xl bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest"
                                >
                                    <ExternalLink size={16} /> Visitar Sitio Público
                                </a>
                            </div>
                            <button 
                                onClick={() => handleDeleteComplex(c.id, c.name)}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                <Trash2 size={16} /> Borrar Complejo
                            </button>
                        </div>
                    </div>
                </div>
            )
        })
    }

    const handleCreateBroadcast = async (e: React.FormEvent) => {
        e.preventDefault()
        const form = e.target as HTMLFormElement
        const formData = new FormData(form)
        
        try {
            const res = await fetch('/api/saas/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.get('title'),
                    message: formData.get('message'),
                    type: formData.get('type'),
                    sendWhatsApp: formData.get('sendWhatsApp') === 'true'
                })
            })
            if (res.ok) {
                form.reset()
                const updatedNotifs = await fetch('/api/saas/notifications').then(r => r.json())
                setNotifications(updatedNotifs)
            }
        } catch (e) {
            alert('Error al crear notificación')
        }
    }

    const filteredComplexes = complexes.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading && !stats) return <div className="text-center p-24 text-gray-400 font-black animate-pulse uppercase tracking-[0.3em]">Sincronizando con el servidor central...</div>

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-1">
                        Control <span className="text-primary italic">SaaS</span>
                    </h1>
                    <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">Giga-Panel de Administración Global</p>
                </div>

                <div className="flex w-full md:w-auto p-1 bg-white/5 rounded-xl border border-white/5 backdrop-blur-xl overflow-x-auto no-scrollbar scroll-smooth">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={14} />} label="Stats" />
                    <TabButton active={activeTab === 'complexes'} onClick={() => setActiveTab('complexes')} icon={<Building2 size={14} />} label="Locales" />
                    <TabButton active={activeTab === 'broadcasts'} onClick={() => setActiveTab('broadcasts')} icon={<Megaphone size={14} />} label="Radio" />
                    <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={<History size={14} />} label="Logs" />
                </div>
            </div>

            {/* Modal Portal */}
            <ModalComponent config={modal} onClose={() => setModal({ ...modal, isOpen: false })} />

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <StatCard 
                                title="Ingresos Totales" 
                                value={`$${stats?.revenue?.toLocaleString() || 0}`} 
                                subValue="Histórico acumulado"
                                icon={<DollarSign className="text-emerald-400" />}
                                gradient="from-emerald-900/20 to-slate-900"
                            />
                            <StatCard 
                                title="MRR Proyectado" 
                                value={`$${stats?.mrr?.toLocaleString() || 0}`} 
                                subValue="Recurrente mensual"
                                icon={<TrendingUp className="text-indigo-400" />}
                                gradient="from-indigo-900/20 to-slate-900"
                            />
                            <StatCard 
                                title="Conversión" 
                                value={`${stats?.conversionRate?.toFixed(1) || 0}%`} 
                                subValue="Visitas a venta"
                                icon={<Activity className="text-amber-400" />}
                                gradient="from-amber-900/20 to-slate-900"
                            />
                            <StatCard 
                                title="Locales" 
                                value={complexes.length.toString()} 
                                subValue={`${stats?.subscriptions?.total || 0} activos`}
                                icon={<Building2 className="text-blue-400" />}
                                gradient="from-blue-900/20 to-slate-900"
                            />
                        </div>

                        {/* Secondary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Growth Indicator */}
                            <div className="md:col-span-2 glass p-8 rounded-2xl border border-white/5 bg-white/[0.01]">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Tendencia de Suscripciones</h3>
                                <div className="flex items-end gap-2 h-48 pt-4">
                                    {[20, 35, 25, 45, 60, 55, 75, 90, 85, 95].map((h, i) => (
                                        <div key={i} className="flex-1 group relative">
                                            <motion.div 
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ delay: i * 0.05 }}
                                                className="w-full bg-gradient-to-t from-primary/20 to-primary rounded-t-lg group-hover:to-primary group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                                            />
                                            <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg border border-white/10 z-10 font-black">
                                                {h}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                    <span>Enero</span>
                                    <span>Marzo</span>
                                    <span>Mayo</span>
                                    <span>Julio</span>
                                    <span>Diciembre</span>
                                </div>
                            </div>

                            {/* Plan Distribution */}
                            <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col justify-between">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Distribución de Planes</h3>
                                <div className="space-y-6">
                                    <PlanBar label="Mensual" count={stats?.subscriptions?.monthly || 0} total={stats?.subscriptions?.total || 1} color="bg-indigo-500" />
                                    <PlanBar label="Trimestral" count={stats?.subscriptions?.quarterly || 0} total={stats?.subscriptions?.total || 1} color="bg-emerald-500" />
                                    <PlanBar label="En Prueba" count={stats?.subscriptions?.trial || 0} total={complexes.length || 1} color="bg-amber-500" />
                                </div>
                                <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Churn Rate Estimado</p>
                                    <p className="text-2xl font-black text-red-400">2.4%</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'complexes' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        {/* Search & Filter */}
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nombre..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-gray-600 focus:border-primary outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            <button 
                                onClick={openCreateModal}
                                className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                <PlusCircle size={16} /> Crear Complejo
                            </button>
                        </div>

                        {/* Mobile Cards / Desktop Table */}
                        <div className="grid grid-cols-1 md:hidden gap-4">
                            {filteredComplexes.map(c => (
                                <MobileComplexCard 
                                    key={c.id} 
                                    c={c} 
                                    onView={() => handleViewComplex(c)}
                                />
                            ))}
                        </div>

                        <div className="hidden md:block glass rounded-2xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Complejo / ID</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Plan & Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Métricas</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredComplexes.map(c => (
                                        <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => handleViewComplex(c)}
                                                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-primary/20 border border-white/10 flex items-center justify-center font-black text-primary hover:scale-105 transition-transform"
                                                    >
                                                        {c.name[0]}
                                                    </button>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-white group-hover:text-primary transition-colors">
                                                                {c.name}
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 font-mono tracking-wider">{c.slug}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex gap-2">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest border ${c.subscriptionActive ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                                            {c.subscriptionActive ? 'PREMIUM' : 'FREE'}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest border ${c.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                            {c.isActive ? 'ACTIVO' : 'BLOQUEADO'}
                                                        </span>
                                                    </div>
                                                    {c.trialEndsAt && !c.subscriptionActive && (
                                                        <p className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1">
                                                            <span>⏳ {getTrialDays(c.trialEndsAt)} días restantes</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex gap-4 text-gray-400">
                                                    <MetricMini label="Reservas" val={c.stats?.bookings || 0} />
                                                    <MetricMini label="Facturado" val={`$${c.stats?.revenue?.toLocaleString() || 0}`} />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button 
                                                    onClick={() => handleViewComplex(c)}
                                                    className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 border border-white/10 hover:border-white/30 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 inline-flex"
                                                >
                                                    Gestionar <ArrowUpRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'broadcasts' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {/* Manager */}
                        <div className="glass p-8 rounded-2xl border border-white/5 space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase">Nuevo Mensaje Global</h3>
                                <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">Llegará a todos los administradores activos</p>
                            </div>
                            <form onSubmit={handleCreateBroadcast} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Título del Aviso</label>
                                    <input name="title" required className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none text-sm" placeholder="Mantenimiento programado..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contenido</label>
                                    <textarea name="message" required rows={3} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none resize-none text-sm" placeholder="Detalles..." />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tipo</label>
                                        <select name="type" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none text-xs">
                                            <option value="info">Información</option>
                                            <option value="success">Novedad</option>
                                            <option value="warning">Alerta</option>
                                            <option value="danger">Crítico</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 rounded-xl border border-white/5 p-4">
                                        <input type="checkbox" name="sendWhatsApp" value="true" className="w-4 h-4 rounded border-white/10" id="wa-check" />
                                        <label htmlFor="wa-check" className="text-[10px] font-black text-gray-400 uppercase cursor-pointer">WhatsApp 📱</label>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <button className="w-full bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all">
                                            Enviar Ahora 🚀
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Recent History */}
                        <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col h-full overflow-hidden">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Historial de Difusión</h3>
                            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {notifications.map(n => (
                                    <div key={n.id} className="p-4 bg-white/5 border border-white/5 rounded-xl border-l-4 border-l-primary flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm text-white">{n.title}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{n.message}</p>
                                            <p className="text-[10px] text-gray-600 font-bold mt-2 uppercase">{new Date(n.createdAt).toLocaleString()}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${n.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                            {n.active ? 'EN VIVO' : 'CERRADO'}
                                        </span>
                                    </div>
                                ))}
                                {notifications.length === 0 && <p className="text-gray-600 italic text-center text-sm py-10">No hay broadcasts registrados.</p>}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'audit' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass rounded-2xl border border-white/5 overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Auditoría Central</h3>
                            <button 
                                onClick={fetchAllData} 
                                className="text-xs text-primary font-bold flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10"
                                disabled={refreshing}
                            >
                                <motion.div
                                    animate={refreshing ? { rotate: 360 } : {}}
                                    transition={{ repeat: refreshing ? Infinity : 0, duration: 1, ease: 'linear' }}
                                >
                                    🔄
                                </motion.div>
                                <span className="hidden xs:inline">Refrescar</span>
                            </button>
                        </div>

                        {/* Mobile Logs */}
                        <div className="md:hidden divide-y divide-white/5">
                            {auditLogs.map(log => (
                                <div key={log.id} className="p-5 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <span className="p-2 rounded-lg bg-white/5"><ShieldCheck size={12} className="text-indigo-400" /></span>
                                            <span className="font-bold text-white text-[11px] uppercase tracking-wide">{log.action.replace(/_/g, ' ')}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-gray-600">{new Date(log.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-mono bg-white/[0.02] p-2 rounded-lg border border-white/5 overflow-x-auto whitespace-pre-wrap">{log.details}</p>
                                    <div className="flex justify-between items-center text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">
                                        <span>BY: {log.userId.substring(0, 8)}...</span>
                                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block max-h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-4">Evento</th>
                                        <th className="px-8 py-4">Super Admin</th>
                                        <th className="px-8 py-4 text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {auditLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-white/[0.01]">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className="p-2 rounded-lg bg-white/5"><ShieldCheck size={14} className="text-indigo-400" /></span>
                                                    <div>
                                                        <span className="font-bold text-white text-sm uppercase tracking-wide">{log.action.replace(/_/g, ' ')}</span>
                                                        <p className="text-[10px] text-gray-600 font-mono mt-0.5">{log.details}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-gray-400 text-xs font-medium">{log.userId}</td>
                                            <td className="px-8 py-5 text-right font-mono text-[10px] text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {auditLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center py-20 text-gray-600 italic">No hay registros de auditoría disponibles.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// --- Helper Components ---

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all
                ${active 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'}
            `}
        >
            {icon}
            {label}
        </button>
    )
}

function StatCard({ title, value, subValue, icon, gradient, trend }: any) {
    return (
        <div className={`glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br ${gradient} overflow-hidden relative group`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                {icon}
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
            <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-black text-white">{value}</h3>
                {trend && (
                    <span className="text-[10px] font-black text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-2">{subValue}</p>
        </div>
    )
}

function PlanBar({ label, count, total, color }: any) {
    const percentage = Math.max(5, (count / total) * 100)
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-gray-500">{label}</span>
                <span className="text-white">{count} ({Math.round(percentage)}%)</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                />
            </div>
        </div>
    )
}

function MetricMini({ label, val }: any) {
    return (
        <div className="flex flex-col">
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">{label}</span>
            <span className="text-xs font-bold text-gray-300">{val}</span>
        </div>
    )
}

function getTrialDays(trialEndsAt: string | null) {
    if (!trialEndsAt) return 0
    const end = new Date(trialEndsAt)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// --- New Mobile & UI Components ---

function ModalComponent({ config, onClose }: { config: any, onClose: () => void }) {
    if (!config.isOpen) return null
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="text-lg font-black text-white uppercase tracking-tight">{config.title}</h2>
                    </div>
                    <div className="p-6">
                        {config.content}
                    </div>
                    <div className="p-6 border-t border-white/5 bg-white/[0.01] flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={() => {
                                config.onConfirm?.()
                                if (config.type === 'confirm') onClose()
                            }}
                            className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            {config.type === 'form' ? 'Confirmar' : 'Aceptar'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

function MobileComplexCard({ c, onView }: { c: any, onView: () => void }) {
    return (
        <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onView}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-primary/20 border border-white/10 flex items-center justify-center font-black text-primary active:scale-95 transition-transform"
                    >
                        {c.name[0]}
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                                {c.name}
                            </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono tracking-wider">{c.slug}</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black tracking-widest border ${c.subscriptionActive ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {c.subscriptionActive ? 'PREMIUM' : 'FREE'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/5">
                <MetricMini label="Reservas" val={c.stats?.bookings || 0} />
                <MetricMini 
                    label={c.subscriptionActive ? "Facturado" : "Días Trial"} 
                    val={c.subscriptionActive 
                        ? `$${c.stats?.revenue?.toLocaleString() || 0}` 
                        : `${getTrialDays(c.trialEndsAt)} días`
                    } 
                />
            </div>

            <div className="pt-1">
                <button 
                    onClick={onView}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary/10 text-primary border border-primary/20 active:scale-[0.98] transition-all text-[10px] font-black uppercase tracking-widest"
                >
                    Gestionar Complejo
                </button>
            </div>
        </div>
    )
}
