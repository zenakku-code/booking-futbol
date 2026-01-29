import { describe, it, expect, vi } from 'vitest'
import { GET as getFields, POST as createField } from '@/app/api/fields/route'
import { DELETE as deleteField } from '@/app/api/fields/[id]/route'
import { POST as createBooking } from '@/app/api/bookings/route'
import { PUT as updateBooking } from '@/app/api/bookings/[id]/route'
import { prisma } from '@/lib/prisma'

describe('Integration Flow', () => {
    let fieldId = ''
    let bookingId = ''

    it('should create a new field', async () => {
        const req = new Request('http://localhost/api/fields', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test Field Integration',
                type: '5',
                price: 1500
            })
        })
        const res = await createField(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.name).toBe('Test Field Integration')
        expect(data.id).toBeDefined()
        fieldId = data.id
    })

    it('should list fields', async () => {
        const res = await getFields()
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.some((f: any) => f.id === fieldId)).toBe(true)
    })

    it('should create a booking', async () => {
        const req = new Request('http://localhost/api/bookings', {
            method: 'POST',
            body: JSON.stringify({
                fieldId,
                date: '2026-02-01',
                startTime: '20:00',
                endTime: '21:00',
                clientName: 'Integration Tester',
                clientPhone: '123456',
                totalPrice: 1500
            })
        })
        const res = await createBooking(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.id).toBeDefined()
        expect(data.status).toBe('pending')
        bookingId = data.id
    })

    it('should approve booking', async () => {
        const req = new Request(`http://localhost/api/bookings/${bookingId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'confirmed' })
        })
        // Mock params
        const params = Promise.resolve({ id: bookingId })
        const res = await updateBooking(req, { params })
        const data = await res.json()

        expect(data.status).toBe('confirmed')
    })

    // Cleanup
    it('should delete field', async () => {
        // First delete booking to avoid constraint error?
        // Prisma schema usually enables cascade or we must manual delete.
        // My schema didn't specify cascade delete on booking relation.
        // "field Field @relation(fields: [fieldId], references: [id])" - default is usually restricted.
        // I should delete booking first.

        await prisma.booking.delete({ where: { id: bookingId } })

        const req = new Request(`http://localhost/api/fields/${fieldId}`, {
            method: 'DELETE'
        })
        const params = Promise.resolve({ id: fieldId })
        const res = await deleteField(req, { params })
        expect(res.status).toBe(200)

        // Verify deletion
        const check = await prisma.field.findUnique({ where: { id: fieldId } })
        expect(check).toBeNull()
    })
})
