'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function SubscriptionCheck() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Skip check on login or expired page itself
        if (pathname === '/admin/login' || pathname === '/expired' || pathname.startsWith('/saas-admin')) return

        const checkStatus = async () => {
            try {
                const res = await fetch('/api/saas/status')
                if (res.status === 401) {
                    // Let middleware or layout handle login redirect
                    return
                }
                const data = await res.json()

                if (data.hasAccess === false) {
                    router.push('/expired')
                }
            } catch (e) {
                console.error('Subscription check failed', e)
            }
        }

        checkStatus()
        // Check every 5 minutes just in case
        const interval = setInterval(checkStatus, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [pathname, router])

    return null // Invisible component
}
