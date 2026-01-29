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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 group hover:border-primary/30 transition-all">
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tu Link para Clientes</p>
                <p className="text-white font-medium text-sm truncate opacity-80">{clientUrl}</p>
            </div>
            <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary text-slate-900 hover:scale-105 active:scale-95'
                    }`}
            >
                {copied ? (
                    <>
                        <span>✓</span> Copiado
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0c0 .414-.336.75-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                        Copiar Link
                    </>
                )}
            </button>
        </div>
    )
}
