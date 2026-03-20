"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function FloatingCTA() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past the hero (400px)
            setIsVisible(window.scrollY > 400)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden transition-all duration-500 ${
                isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-full opacity-0'
            }`}
        >
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-[0_-5px_40px_rgba(0,0,0,0.8)]">
                <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">¿Tenés un complejo?</p>
                    <p className="text-gray-400 text-[10px] truncate">7 días gratis · Sin tarjeta</p>
                </div>
                <Link 
                    href="/register" 
                    className="btn btn-primary text-xs px-5 py-2.5 font-black whitespace-nowrap shadow-[0_0_20px_rgba(16,185,129,0.4)] shrink-0"
                >
                    PROBAR GRATIS
                </Link>
            </div>
        </div>
    )
}
