'use client'
import { useState, useEffect } from 'react'

export default function ClientLink({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false)
    const [baseUrl, setBaseUrl] = useState('')

    useEffect(() => {
        setBaseUrl(window.location.origin)
    }, [])

    const clientUrl = `${baseUrl}/${slug}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(clientUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy!', err)
        }
    }

    return (
        <div className="inline-flex items-center gap-3 bg-slate-800/50 p-2 pr-4 rounded-xl border border-white/10 group hover:border-primary/30 transition-all hover:bg-slate-800/80">
            {/* Icono */}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.291a3.75 3.75 0 005.304 0l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01.646-1.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 000 5.304z" clipRule="evenodd" /> {/* Icono de cadena/link genérico si el de arriba falla visualmente, pero usaré el de 'globe' mejor */}
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
            </div>

            <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Link para Clientes</span>
                <a href={clientUrl} target="_blank" className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-primary transition-colors group-hover:underline decoration-primary/50 underline-offset-4">
                    Link <span className="text-[10px] opacity-70">🔗</span>
                </a>
            </div>

            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

            <button
                onClick={handleCopy}
                className="group/copy flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Copiar al portapapeles"
            >
                {copied ? (
                    <span className="text-emerald-400 font-bold text-xs animate-fade-in">✓</span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 group-hover/copy:text-white transition-colors">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
                    </svg>
                )}
            </button>
        </div>
    )
}
