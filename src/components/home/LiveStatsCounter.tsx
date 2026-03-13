"use client"

import { useEffect, useState } from 'react'

interface Stats {
    complexes: number
    bookings: number
}

function AnimatedCounter({ value, duration = 2000 }: { value: number, duration?: number }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (value === 0) return

        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // easeOutExpo curve
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            setCount(Math.floor(easeProgress * value));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [value, duration])

    return <span>{count.toLocaleString()}</span>
}

export function LiveStatsCounter() {
    const [stats, setStats] = useState<Stats>({ complexes: 0, bookings: 0 })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/public/live-stats')
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (e) {
                console.error("Failed to fetch live stats")
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [])

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mt-16 animate-fade-in relative z-20">
            <div className="flex flex-col items-center glass-card px-10 py-8 w-full sm:w-auto min-w-[220px] border-t-2 border-accent/50 shadow-2xl relative">
                <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter mix-blend-screen drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                    {isLoading ? <span className="opacity-50 text-2xl">...</span> : <AnimatedCounter value={stats.complexes} />}
                </div>
                <div className="text-accent text-sm md:text-base font-bold uppercase tracking-widest bg-accent/10 px-3 py-1 rounded-full border border-accent/20">Complejos</div>
            </div>

            <div className="hidden sm:block h-16 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

            <div className="flex flex-col items-center glass-card px-8 py-6 w-full sm:w-auto min-w-[200px] border-t-2 border-t-primary/50">
                <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter mix-blend-screen drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    +{isLoading ? <span className="opacity-50 text-2xl">...</span> : <AnimatedCounter value={stats.bookings} />}
                </div>
                <div className="text-primary text-sm md:text-base font-bold uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Reservas Completadas</div>
            </div>
        </div>
    )
}
