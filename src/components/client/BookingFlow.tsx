'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type InventoryItem = {
    id: string
    name: string
    price: number
    stock: number
}

type Field = {
    id: string
    name: string
    price: number
    type: string
    availableDays?: string
    openTime?: string
    closeTime?: string
}

const DAYS_MAP: { [key: number]: string } = {
    0: "Domingo",
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado"
}

export default function BookingFlow({ field, inventory = [] }: { field: Field, inventory?: InventoryItem[] }) {
    const [step, setStep] = useState(1)
    const [date, setDate] = useState('')
    const [selectedTime, setSelectedTime] = useState('')
    const [clientName, setClientName] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [selectedItems, setSelectedItems] = useState<{ [id: string]: number }>({})
    const [takenSlots, setTakenSlots] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Generate valid dates (next 14 days)
    const [availableDates, setAvailableDates] = useState<{ date: string, dayName: string, dayNumber: number, fullDate: Date }[]>([])

    useEffect(() => {
        const dates = []
        const today = new Date()
        const allowedDays = field.availableDays ? field.availableDays.split(',') : Object.values(DAYS_MAP)

        for (let i = 0; i < 14; i++) {
            const d = new Date(today)
            d.setDate(today.getDate() + i)
            const dayName = DAYS_MAP[d.getDay()]

            if (allowedDays.includes(dayName)) {
                dates.push({
                    date: d.toISOString().split('T')[0],
                    dayName: dayName.slice(0, 3), // Lun, Mar
                    dayNumber: d.getDate(),
                    fullDate: d
                })
            }
        }
        setAvailableDates(dates)
        // Select first available date by default
        if (dates.length > 0 && !date) {
            setDate(dates[0].date)
        }
    }, [field.availableDays])

    // Generate Slots based on Open/Close time
    const [slots, setSlots] = useState<string[]>([])

    useEffect(() => {
        if (!field.openTime || !field.closeTime) return

        const start = parseInt(field.openTime.split(':')[0])
        const end = parseInt(field.closeTime.split(':')[0])
        const generatedSlots = []

        for (let i = start; i < end; i++) {
            generatedSlots.push(`${i}:00`)
        }
        setSlots(generatedSlots)
    }, [field.openTime, field.closeTime])

    useEffect(() => {
        if (date) {
            fetch(`/api/bookings?fieldId=${field.id}&date=${date}`)
                .then(res => res.json())
                .then(data => {
                    const taken = data.map((b: any) => b.startTime)
                    setTakenSlots(taken)
                })
        }
    }, [date, field.id])

    const handleBooking = async () => {
        setIsLoading(true)
        const itemsPayload = Object.entries(selectedItems)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => ({
                id,
                quantity: qty
            }))

        const itemsTotal = itemsPayload.reduce((acc, item) => {
            const invItem = inventory.find(i => i.id === item.id)
            return acc + (invItem?.price || 0) * item.quantity
        }, 0)

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fieldId: field.id,
                    date,
                    startTime: selectedTime,
                    endTime: `${parseInt(selectedTime) + 1}:00`,
                    clientName,
                    clientPhone,
                    totalPrice: field.price + itemsTotal,
                    items: itemsPayload
                })
            })

            if (!res.ok) {
                const err = await res.json()
                alert(err.error || 'Error booking')
                return
            }

            const data = await res.json()

            if (data.paymentUrl) {
                window.location.href = data.paymentUrl
            } else {
                setSuccess(true)
            }
        } catch (e) {
            alert('Error networking')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="glass p-8 rounded-2xl text-center animate-fade-in">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-4">¡Reserva Confirmada!</h2>
                <p className="text-gray-300 mb-6">Te esperamos el {date} a las {selectedTime}hs.</p>
                <button onClick={() => window.location.href = '/'} className="btn btn-primary">
                    Volver al Inicio
                </button>
            </div>
        )
    }

    return (
        <div className="glass-card w-full p-4 sm:p-6 md:p-10 max-w-2xl mx-auto transform transition-all duration-500">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Reserva tu lugar</span>
                    <span className="text-xs font-medium text-gray-500">Paso {step} de 2</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                        style={{ width: step === 1 ? '50%' : '100%' }}
                    />
                </div>
            </div>

            {step === 1 && (
                <div className="animate-fade-in space-y-6 md:space-y-8">
                    {/* Date Strip */}
                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-3 pl-1">Selecciona una Fecha</label>
                        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 custom-scrollbar -mx-1 px-1">
                            {availableDates.map((d) => (
                                <button
                                    key={d.date}
                                    onClick={() => setDate(d.date)}
                                    className={`
                                        flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all duration-300
                                        ${date === d.date
                                            ? 'bg-primary text-slate-900 border-primary scale-105 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                                            : 'bg-slate-800/50 text-gray-400 border-white/5 hover:bg-slate-800 hover:border-white/20 hover:text-white'}
                                    `}
                                >
                                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{d.dayName}</span>
                                    <span className="text-xl sm:text-2xl font-bold">{d.dayNumber}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-3 pl-1">Horarios Disponibles</label>
                        {slots.length > 0 ? (
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                                {slots.map(slot => {
                                    const isTaken = takenSlots.includes(slot)
                                    return (
                                        <button
                                            key={slot}
                                            disabled={isTaken}
                                            onClick={() => setSelectedTime(slot)}
                                            className={`
                                                py-3 px-1 rounded-xl text-sm font-bold border transition-all relative overflow-hidden
                                                ${selectedTime === slot
                                                    ? 'bg-primary text-slate-900 border-primary shadow-[0_0_10px_rgba(74,222,128,0.3)]'
                                                    : 'bg-slate-800/50 text-white border-white/5'}
                                                ${isTaken ? 'opacity-30 cursor-not-allowed grayscale bg-slate-900/50' : 'hover:border-white/20'}
                                            `}
                                        >
                                            <span className="relative z-10">{slot}</span>
                                            {isTaken && <div className="absolute inset-0 flex items-center justify-center -z-0">
                                                <div className="w-full h-[1px] bg-red-500/30 rotate-45 transform scale-110"></div>
                                            </div>}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                No hay horarios configurados para esta cancha.
                            </div>
                        )}
                    </div>

                    <button
                        disabled={!date || !selectedTime}
                        onClick={() => setStep(2)}
                        className="w-full btn btn-primary py-4 text-lg shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none mt-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Continuar
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">Resumen del Turno</h3>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div>
                                <p className="text-2xl font-black text-white">{date}</p>
                                <p className="text-sm text-gray-400">{field.name} • Futbol {field.type}</p>
                            </div>
                            <span className="px-4 py-2 bg-primary/20 text-primary rounded-xl font-black shadow-lg shadow-primary/5">{selectedTime} hs</span>
                        </div>

                        <div className="space-y-2 border-t border-white/5 pt-4 mt-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Cancha</span>
                                <span className="text-white font-bold">${field.price}</span>
                            </div>
                            {Object.entries(selectedItems).map(([id, qty]) => {
                                if (qty === 0) return null
                                const itm = inventory.find(i => i.id === id)
                                return (
                                    <div key={id} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{itm?.name} (x{qty})</span>
                                        <span className="text-white font-bold">${(itm?.price || 0) * qty}</span>
                                    </div>
                                )
                            })}
                            <div className="flex justify-between text-xl font-black text-primary pt-2 border-t border-white/10 mt-2">
                                <span>TOTAL</span>
                                <span>${field.price + Object.entries(selectedItems).reduce((acc, [id, qty]) => {
                                    const itm = inventory.find(i => i.id === id)
                                    return acc + (itm?.price || 0) * qty
                                }, 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Items Selection */}
                    {inventory.length > 0 && (
                        <div className="mb-6 animate-fade-in-up">
                            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 px-1">¿Necesitas algo más?</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {inventory.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">🎒</div>
                                            <div>
                                                <p className="text-white font-bold text-sm">{item.name}</p>
                                                <p className="text-primary text-xs font-bold">${item.price}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-1">
                                            <button
                                                onClick={() => setSelectedItems({ ...selectedItems, [item.id]: Math.max(0, (selectedItems[item.id] || 0) - 1) })}
                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                            >-</button>
                                            <span className="w-4 text-center text-white font-black text-sm">{selectedItems[item.id] || 0}</span>
                                            <button
                                                onClick={() => setSelectedItems({ ...selectedItems, [item.id]: Math.min(item.stock, (selectedItems[item.id] || 0) + 1) })}
                                                className="w-8 h-8 flex items-center justify-center text-primary font-bold hover:scale-110 transition-transform"
                                            >+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-gray-300 font-medium mb-2 pl-1">Nombre Completo</label>
                        <input
                            type="text"
                            placeholder="Tu nombre"
                            className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-600"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 font-medium mb-2 pl-1">Teléfono / WhatsApp</label>
                        <input
                            type="tel"
                            placeholder="Ej: 11 1234 5678"
                            className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-600"
                            value={clientPhone}
                            onChange={e => setClientPhone(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                            Volver
                        </button>
                        <button
                            onClick={handleBooking}
                            disabled={!clientName || !clientPhone || isLoading}
                            className="flex-[2] btn btn-primary py-4 text-lg shadow-lg shadow-primary/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? 'Procesando...' : 'Confirmar Reserva'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
