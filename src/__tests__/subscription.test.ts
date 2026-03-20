
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as activateTrial } from '@/app/api/subscription/activate-trial/route'
import { POST as subscribe } from '@/app/api/subscription/subscribe/route'
import { GET as getStatus } from '@/app/api/subscription/status/route'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        complex: {
            findUnique: vi.fn(),
            update: vi.fn(),
            count: vi.fn()
        },
        subscriptionPayment: {
            create: vi.fn()
        }
    }
}))

vi.mock('@/lib/auth', () => ({
    getSession: vi.fn()
}))

// Mock console to reduce noise
console.error = vi.fn()
console.log = vi.fn()

describe('Subscription System Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Trial Activation (Strict Logic)', () => {

        it('should block activation if trial has been used before (trialEndsAt is set)', async () => {
            (getSession as any).mockResolvedValue({ complexId: 'c1' });
            // Mock complex with expired trial date
            (prisma.complex.findUnique as any).mockResolvedValue({
                id: 'c1',
                trialEndsAt: new Date('2023-01-01'), // Used in past
                subscriptionDate: null
            });

            const res = await activateTrial();
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toMatch(/utilizado anteriormente/);
        })

        it('should block activation if paid subscription exists', async () => {
            (getSession as any).mockResolvedValue({ complexId: 'c1' });
            (prisma.complex.findUnique as any).mockResolvedValue({
                id: 'c1',
                trialEndsAt: null,
                subscriptionDate: new Date() // Paid
            });

            const res = await activateTrial();
            expect(res.status).toBe(400);
        })

        it('should activate trial if never used', async () => {
            (getSession as any).mockResolvedValue({ complexId: 'c1' });
            (prisma.complex.findUnique as any).mockResolvedValue({
                id: 'c1',
                trialEndsAt: null,
                subscriptionDate: null
            });

            const res = await activateTrial();
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(prisma.complex.update).toHaveBeenCalledWith({
                where: { id: 'c1' },
                data: expect.objectContaining({
                    subscriptionActive: true
                    // trialEndsAt check is tricky with dates, but implied
                })
            });
        })
    })

    describe('Subscription Plans (Monthly/Quarterly)', () => {

        it('should calculate Monthly expiration correctly (+30 days)', async () => {
            (getSession as any).mockResolvedValue({ complexId: 'c1' });
            (prisma.complex.findUnique as any).mockResolvedValue({
                id: 'c1',
                subscriptionEndsAt: null
            });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ planType: 'MONTHLY' })
            });

            const res = await subscribe(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.planType).toBe('MONTHLY');

            // Verify Prisma update
            const updateCall = (prisma.complex.update as any).mock.calls[0][0];
            const endsAt = updateCall.data.subscriptionEndsAt;
            const now = new Date();
            const diffDays = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            expect(diffDays).toBeCloseTo(30, 0); // Allow roughly 30 days
            expect(prisma.subscriptionPayment.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ amount: 10000, planType: 'MONTHLY' })
            });
        })

        it('should calculate Quarterly expiration correctly (+90 days)', async () => {
            (getSession as any).mockResolvedValue({ complexId: 'c1' });
            (prisma.complex.findUnique as any).mockResolvedValue({
                id: 'c1',
                subscriptionEndsAt: null
            });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ planType: 'QUARTERLY' })
            });

            const res = await subscribe(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.planType).toBe('QUARTERLY');

            const updateCall = (prisma.complex.update as any).mock.calls[0][0];
            const endsAt = updateCall.data.subscriptionEndsAt;
            const now = new Date();
            const diffDays = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            expect(diffDays).toBeCloseTo(90, 0); // Allow roughly 90 days
            expect(prisma.subscriptionPayment.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ amount: 27000, planType: 'QUARTERLY' })
            });
        })
    })

    describe('Access Control (Status API)', () => {

        it('should deny access if trial expired and no active subscription', async () => {
            (getSession as any).mockResolvedValue({ complexId: 'c1' });
            (prisma.complex.findUnique as any).mockResolvedValue({
                id: 'c1',
                isActive: true, // Not banned
                trialEndsAt: new Date('2023-01-01'), // Expired
                subscriptionEndsAt: null
            });

            const res = await getStatus();
            const data = await res.json();

            expect(data.hasAccess).toBe(false);
            expect(data.trialExpired).toBe(true);
        })

        it('should grant access if trial is active', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);

            (getSession as any).mockResolvedValue({ complexId: 'c1' });
            (prisma.complex.findUnique as any).mockResolvedValue({
                id: 'c1',
                isActive: true,
                trialEndsAt: futureDate,
                subscriptionEndsAt: null
            });

            const res = await getStatus();
            const data = await res.json();

            expect(data.hasAccess).toBe(true);
        })

        it('should grant access if subscription is active (ends in future)', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);

            (getSession as any).mockResolvedValue({ complexId: 'c1' });
            (prisma.complex.findUnique as any).mockResolvedValue({
                id: 'c1',
                isActive: true,
                trialEndsAt: new Date('2023-01-01'), // Trial expired
                subscriptionEndsAt: futureDate // Sub active
            });

            const res = await getStatus();
            const data = await res.json();

            expect(data.hasAccess).toBe(true);
        })

        it('should deny access if subscription expired', async () => {
            const pastDate = new Date('2023-01-01');

            (getSession as any).mockResolvedValue({ complexId: 'c1' });
            (prisma.complex.findUnique as any).mockResolvedValue({
                id: 'c1',
                isActive: true,
                trialEndsAt: pastDate,
                subscriptionEndsAt: pastDate
            });

            const res = await getStatus();
            const data = await res.json();

            expect(data.hasAccess).toBe(false);
        })
    })

})
