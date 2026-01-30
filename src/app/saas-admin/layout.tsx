import React from 'react'

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-primary/30">
            {/* Super Admin Header */}
            <header className="bg-slate-950 border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                            S
                        </div>
                        <h1 className="font-bold text-lg tracking-tight">SaaS Control Center</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/admin/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Ir a Mi Panel
                        </a>
                        <div className="h-4 w-px bg-white/10"></div>
                        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/20 font-mono">
                            SUPER ADMIN
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
