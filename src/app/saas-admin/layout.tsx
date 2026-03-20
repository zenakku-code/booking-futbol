import React from 'react'
import Link from 'next/link'

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-2xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-2xl"></div>
            </div>
            {/* Super Admin Header */}
            <header className="bg-slate-950 border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-2xl shadow-primary/20 border border-white/10">
                            <img src="/logo-tikitaka.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="font-black text-xl tracking-tighter uppercase leading-none">
                                TIKI<span className="text-primary italic">TAKA</span>
                            </h1>
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">SaaS Control</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/admin" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all bg-white/5 px-5 py-2.5 rounded-xl border border-white/5 active:scale-95">
                            Ir a Mi Panel ⚡
                        </Link>
                        <div className="h-6 w-px bg-white/5"></div>
                        <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/20 tracking-widest uppercase">
                            Super Admin
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    )
}
