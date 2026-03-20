
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as createField } from '@/app/api/fields/route'
import { DELETE as deleteField } from '@/app/api/fields/[id]/route'
import { GET as getBookings } from '@/app/api/bookings/route'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Mock de Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        complex: { findUnique: vi.fn() },
        field: {
            create: vi.fn(),
            findFirst: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn()
        },
        booking: { findMany: vi.fn() }
    }
}))

// Mock de Auth
vi.mock('@/lib/auth', () => ({
    getComplexId: vi.fn()
}))

// Mock console.error to avoid noise
console.error = vi.fn()

function createJsonRequest(body: any) {
    return new Request('http://localhost:3000/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
}

describe('API Security & Logic Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Subscription Enforcement (Subscription Model Phase 2)', () => {
        it('POST /api/fields - should block creation if subscription is inactive', async () => {
            (getComplexId as any).mockResolvedValue('complex-123');
            (prisma.complex.findUnique as any).mockResolvedValue({ id: 'complex-123', subscriptionActive: false }); // SUSCRIPCION INACTIVA

            const req = createJsonRequest({ name: 'Cancha Test', type: 5, price: 1000 });
            const res = await createField(req);
            const data = await res.json();

            expect(res.status).toBe(403);
            expect(data.error).toBe('Suscripción requerida');
        })

        it('DELETE /api/fields/[id] - should block deletion if subscription is inactive', async () => {
            (getComplexId as any).mockResolvedValue('complex-123');
            // Mock field ownership check
            (prisma.field.findFirst as any).mockResolvedValue({ id: 'field-1', complexId: 'complex-123' });
            // Mock subscription check -> INACTIVE
            (prisma.complex.findUnique as any).mockResolvedValue({ id: 'complex-123', subscriptionActive: false });

            const req = new Request('http://localhost/api/fields/field-1', { method: 'DELETE' });
            const params = Promise.resolve({ id: 'field-1' });

            const res = await deleteField(req, { params });

            // Esto confirma que aplicamos el fix de seguridad correctamente
            expect(res.status).toBe(403);
        })

        it('POST /api/fields - should allow creation if subscription is active', async () => {
            (getComplexId as any).mockResolvedValue('complex-123');
            (prisma.complex.findUnique as any).mockResolvedValue({ id: 'complex-123', subscriptionActive: true }); // ACTIVE
            (prisma.field.create as any).mockResolvedValue({ id: 'field-new', name: 'Cancha Test' });

            const req = createJsonRequest({ name: 'Cancha Test', type: 5, price: 1000 });
            const res = await createField(req);

            expect(res.status).toBe(200);
        })
    })

    describe('Data Security (Data Leaks)', () => {
        it('GET /api/bookings - should fail if fieldId is missing in public query', async () => {
            // query sin fieldId
            const req = new Request('http://localhost:3000/api/bookings');
            const res = await getBookings(req);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toBeDefined();
        })

        it('GET /api/bookings - should succeed with fieldId', async () => {
            (getComplexId as any).mockResolvedValue(null); // Anonymous user
            (prisma.booking.findMany as any).mockResolvedValue([]);

            const req = new Request('http://localhost:3000/api/bookings?fieldId=field-1');
            const res = await getBookings(req);

            expect(res.status).toBe(200);
        })
    })
})
