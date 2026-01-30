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
    const [paymentType, setPaymentType] = useState('FULL')

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
                    date: d.toLocaleDateString('en-CA'), // YYYY-MM-DD Local (Fixes UTC shift bug)
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
        if (!date) return

        const start = parseInt(field.openTime.split(':')[0])
        const end = parseInt(field.closeTime.split(':')[0])
        const generatedSlots = []

        const now = new Date()
        // Ajuste zona horaria local simple
        const todayStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD local
        const isToday = date === todayStr || date === now.toISOString().split('T')[0]
        const currentHour = now.getHours()

        for (let i = start; i < end; i++) {
            // Filter past slots only if it's today
            if (isToday && i <= currentHour) continue
            generatedSlots.push(`${i}:00`)
        }
        setSlots(generatedSlots)
    }, [field.openTime, field.closeTime, date])

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
                    items: itemsPayload,
                    paymentType
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
            <div className="glass p-8 rounded-2xl text-center animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10"></div>
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-4">¡Reserva Confirmada!</h2>
                <p className="text-gray-300 mb-6">Te esperamos el {date} a las {selectedTime}hs.</p>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6 max-w-xs mx-auto">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Tu Código</div>
                    <div className="font-mono text-xl text-primary font-bold tracking-[0.2em] select-all">#{Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
                </div>
                <button onClick={() => window.location.href = '/'} className="btn btn-primary shadow-lg shadow-primary/20">
                    Volver al Inicio
                </button>
            </div>
        )
    }

    return (
        <div className="glass-card w-full p-4 sm:p-6 md:p-8 max-w-2xl mx-auto transform transition-all duration-500 relative bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 shadow-2xl">
            {/* Background Glows */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="mb-8 relative z-10">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Reserva tu cancha</span>
                    <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-full">PASO {step} / 2</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-[2px]">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                        style={{ width: step === 1 ? '50%' : '100%' }}
                    />
                </div>
            </div>

            {step === 1 && (
                <div className="animate-fade-in space-y-8 md:space-y-10 relative z-10">
                    {/* Date Strip */}
                    <div>
                        <label className="block text-gray-300 text-sm font-bold uppercase tracking-wider mb-4 pl-1 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
                            Selecciona Fecha
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-6 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
                            {availableDates.map((d) => (
                                <button
                                    key={d.date}
                                    onClick={() => setDate(d.date)}
                                    className={`
                                        snap-center flex-shrink-0 w-[4.5rem] h-20 sm:w-20 sm:h-24 rounded-2xl flex flex-col items-center justify-center gap-0.5 border transition-all duration-300 relative overflow-hidden group
                                        ${date === d.date
                                            ? 'bg-gradient-to-br from-primary to-emerald-600 text-slate-900 border-transparent shadow-[0_8px_20px_-8px_rgba(34,197,94,0.6)] scale-110 z-10 translate-y-[-2px]'
                                            : 'bg-slate-800/40 text-gray-400 border-white/5 hover:bg-slate-800/80 hover:border-white/20 hover:text-white backdrop-blur-md'}
                                    `}
                                >
                                    {/* Glossy effect */}
                                    {date === d.date && <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none" />}

                                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${date === d.date ? 'text-slate-800' : ''}`}>{d.dayName}</span>
                                    <span className="text-xl sm:text-2xl font-black">{d.dayNumber}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <label className="block text-gray-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
                                Elige Horario
                            </label>
                            {selectedTime && <span className="text-primary font-bold text-xs animate-pulse bg-primary/10 px-2 py-1 rounded-lg">{selectedTime}hs Seleccionado</span>}
                        </div>

                        {slots.length > 0 ? (
                            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-3">
                                {slots.map(slot => {
                                    const isTaken = takenSlots.includes(slot)
                                    const isSelected = selectedTime === slot
                                    return (
                                        <button
                                            key={slot}
                                            disabled={isTaken}
                                            onClick={() => setSelectedTime(slot)}
                                            className={`
                                                py-3 rounded-xl text-sm font-bold border transition-all relative overflow-hidden group min-h-[50px]
                                                ${isSelected
                                                    ? 'bg-primary text-slate-900 border-primary shadow-[0_0_15px_rgba(74,222,128,0.4)] scale-105 z-10'
                                                    : 'bg-slate-800/40 text-white border-white/5 hover:border-white/30 hover:bg-slate-800/80 text-shadow-sm'}
                                                ${isTaken ? 'opacity-40 cursor-not-allowed border-transparent bg-slate-900 text-gray-600' : ''}
                                            `}
                                        >
                                            <span className={`relative z-10 ${isTaken ? 'blur-[1px]' : ''}`}>{slot}</span>

                                            {isTaken && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-20">
                                                    <div className="w-[120%] h-[1px] bg-red-500/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-25deg]"></div>
                                                    <div className="w-[120%] h-[1px] bg-red-500/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[25deg]"></div>
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-6 bg-slate-800/30 rounded-3xl border border-dashed border-white/10">
                                <span className="text-3xl block mb-2 opacity-50">😴</span>
                                <span className="text-gray-400">No hay horarios disponibles para hoy. Intenta otra fecha.</span>
                            </div>
                        )}
                    </div>

                    <div className="sticky bottom-4 z-50 pt-4">
                        <div className="absolute inset-x-0 bottom-[-20px] h-32 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent pointer-events-none -z-10"></div>
                        <button
                            disabled={!date || !selectedTime}
                            onClick={() => setStep(2)}
                            className="w-full btn btn-primary py-4 text-lg font-black shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_-5px_rgba(34,197,94,0.6)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99] rounded-2xl flex items-center justify-center gap-2 ring-1 ring-white/20"
                        >
                            <span>CONTINUAR</span>
                            {date && selectedTime && <span className="text-slate-900 ml-2">→</span>}
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in space-y-8 relative z-10">
                    {/* TICKET UI */}
                    <div className="relative isolate transform transition-all hover:scale-[1.01] duration-500">
                        {/* Glow behind ticket */}
                        <div className="absolute inset-0 bg-primary/20 blur-3xl transform rotate-3 scale-90 -z-10"></div>

                        <div className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
                            {/* Ticket Header */}
                            <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Cancha</p>
                                        <h3 className="text-2xl font-black leading-none">{field.name}</h3>
                                        <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide font-bold">Fútbol {field.type} • Sintético</div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Fecha</p>
                                        <p className="text-xl font-bold">{date}</p>
                                        <p className="text-3xl font-black text-primary leading-none mt-1">{selectedTime}:00</p>
                                    </div>
                                </div>
                            </div>

                            {/* Perforated Line */}
                            <div className="relative h-6 bg-slate-900">
                                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100"></div> {/* White part bg */}
                                <div className="absolute -left-3 top-[-10px] w-6 h-6 rounded-full bg-[#020617] z-10"></div> {/* Left Notch */}
                                <div className="absolute -right-3 top-[-10px] w-6 h-6 rounded-full bg-[#020617] z-10"></div> {/* Right Notch */}
                                <div className="absolute bottom-[1px] left-2 right-2 border-b-2 border-dashed border-gray-400/50 z-0"></div>
                            </div>

                            {/* Ticket Body */}
                            <div className="p-6 bg-slate-100 space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-300 pb-2">
                                    <span>Concepto</span>
                                    <span>Importe</span>
                                </div>
                                <div className="flex justify-between items-center font-bold text-slate-800">
                                    <span>Alquiler Cancha</span>
                                    <span>${field.price}</span>
                                </div>
                                {Object.entries(selectedItems).map(([id, qty]) => {
                                    if (qty === 0) return null
                                    const itm = inventory.find(i => i.id === id)
                                    return (
                                        <div key={id} className="flex justify-between items-center text-sm text-gray-600 font-medium">
                                            <span>{itm?.name} (x{qty})</span>
                                            <span>${(itm?.price || 0) * qty}</span>
                                        </div>
                                    )
                                })}

                                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-slate-900">
                                    <span className="text-xl font-black text-slate-900 tracking-tighter">TOTAL</span>
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">${field.price + Object.entries(selectedItems).reduce((acc, [id, qty]) => {
                                        const itm = inventory.find(i => i.id === id)
                                        return acc + (itm?.price || 0) * qty
                                    }, 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory & Extras */}
                    {inventory.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-1">Adicionales</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {inventory.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/40 border border-white/5 rounded-2xl hover:bg-slate-800/60 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner border border-white/5">🎒</div>
                                            <div>
                                                <p className="text-white font-bold text-sm">{item.name}</p>
                                                <p className="text-primary text-xs font-bold">${item.price}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-white/5 shadow-inner">
                                            <button
                                                onClick={() => setSelectedItems({ ...selectedItems, [item.id]: Math.max(0, (selectedItems[item.id] || 0) - 1) })}
                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors font-bold"
                                            >-</button>
                                            <span className="w-6 text-center text-white font-bold text-sm">{selectedItems[item.id] || 0}</span>
                                            <button
                                                onClick={() => setSelectedItems({ ...selectedItems, [item.id]: Math.min(item.stock, (selectedItems[item.id] || 0) + 1) })}
                                                className="w-8 h-8 flex items-center justify-center text-primary font-bold hover:bg-slate-800 rounded transition-all active:scale-95"
                                            >+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payment Method */}
                    <div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 pl-1">Método de Pago</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setPaymentType('FULL')}
                                className={`group p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all duration-300 relative overflow-hidden ${paymentType === 'FULL' ? 'bg-slate-800 border-primary text-white shadow-lg shadow-primary/10' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                            >
                                <span className="text-3xl group-hover:scale-110 transition-transform mb-1">💳</span>
                                <span className={`text-sm font-bold ${paymentType === 'FULL' ? 'text-primary' : ''}`}>Pago Total</span>
                                {paymentType === 'FULL' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]"></div>}
                            </button>
                            <button
                                onClick={() => setPaymentType('SPLIT')}
                                className={`group p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all duration-300 relative overflow-hidden ${paymentType === 'SPLIT' ? 'bg-slate-800 border-accent text-white shadow-lg shadow-accent/10' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                            >
                                <span className="text-3xl group-hover:scale-110 transition-transform mb-1">🐄</span>
                                <span className={`text-sm font-bold ${paymentType === 'SPLIT' ? 'text-accent' : ''}`}>Hacer Vaquita</span>
                                {paymentType === 'SPLIT' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]"></div>}
                            </button>
                        </div>
                    </div>

                    {/* Client Data Form */}
                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="group relative">
                            <input
                                type="text"
                                placeholder=" "
                                className="peer w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pt-6"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                            />
                            <label className="absolute left-4 top-4 text-gray-500 text-xs font-bold uppercase transition-all peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[9px]">Nombre Completo</label>
                        </div>
                        <div className="group relative">
                            <input
                                type="tel"
                                placeholder=" "
                                className="peer w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pt-6"
                                value={clientPhone}
                                onChange={e => setClientPhone(e.target.value)}
                            />
                            <label className="absolute left-4 top-4 text-gray-500 text-xs font-bold uppercase transition-all peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[9px]">Teléfono / WhatsApp</label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 pb-10">
                        <button onClick={() => setStep(1)} className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors border border-white/5">
                            ←
                        </button>
                        <button
                            onClick={handleBooking}
                            disabled={!clientName || !clientPhone || isLoading}
                            className="flex-1 btn btn-primary rounded-2xl font-black text-lg shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)] hover:shadow-[0_0_50px_-10px_rgba(34,197,94,0.6)] disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                                    Enviando...
                                </span>
                            ) : 'CONFIRMAR RESERVA'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
