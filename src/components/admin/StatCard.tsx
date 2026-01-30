import React from 'react'

interface StatCardProps {
    title: string
    value: number
    icon: string
    trend?: string
    color?: string
    borderColor?: string
    highlight?: boolean
    isCurrency?: boolean
}

export default function StatCard({ title, value, icon, trend, color, borderColor, highlight, isCurrency }: StatCardProps) {
    const icons: any = {
        'Stadium': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>,
        'Calendar': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
        'Clock': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        'Money': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        'Chart': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
    }

    return (
        <div className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 transition-all hover:-translate-y-1 hover:shadow-2xl group ${borderColor || 'border-white/5'} ${highlight ? 'ring-1 ring-amber-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)] bg-amber-950/10' : 'bg-slate-900/40'}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${color || 'from-slate-800/20 to-slate-900/20'} z-0 opacity-100`} />
            <div className="absolute right-0 top-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-6">
                    <span className="p-3 bg-slate-950/50 rounded-2xl border border-white/10 text-white group-hover:scale-110 transition-transform shadow-lg">
                        {icons[icon] || icon}
                    </span>
                    {highlight && <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>}
                </div>

                <div>
                    <div className="flex items-end gap-3 mb-1">
                        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                            {isCurrency ? `$${Math.round(value).toLocaleString()}` : value}
                        </h3>
                    </div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{title}</p>
                </div>

                {trend && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${highlight ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                            {trend}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
