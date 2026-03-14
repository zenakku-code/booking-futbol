"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Broadcast {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'danger'
}

export function BroadcastBanner() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const fetchBroadcasts = async () => {
            try {
                const res = await fetch('/api/admin/broadcasts')
                const data = await res.json()
                if (Array.isArray(data)) setBroadcasts(data)
            } catch (e) {
                console.error("Failed to fetch broadcasts")
            }
        }
        fetchBroadcasts()
    }, [])

    if (broadcasts.length === 0) return null

    const current = broadcasts[currentIndex]

    const colors = {
        info: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    }

    return (
        <div className="w-full px-4 mb-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className={`glass p-4 rounded-xl border ${colors[current.type || 'info']} flex items-center justify-between gap-4`}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-xl">📢</span>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{current.title}</p>
                            <p className="text-sm font-medium">{current.message}</p>
                        </div>
                    </div>
                    {broadcasts.length > 1 && (
                        <button 
                            onClick={() => setCurrentIndex((prev) => (prev + 1) % broadcasts.length)}
                            className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100"
                        >
                            Siguiente ({currentIndex + 1}/{broadcasts.length})
                        </button>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
