"use client"

import type React from "react"
import { useState } from "react"
import { X, Calendar, Users, Clock } from "lucide-react"
import { createBooking } from "@/lib/api/bookings"
import MpesaPaymentForm from "./mpesa-payment-form"
import type { Chef, Booking } from "@/lib/api"

interface BookingModalProps {
  chef: Chef
  isOpen: boolean
  onClose: () => void
}

export function BookingModal({ chef, isOpen, onClose }: BookingModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const basePrice = chef.hourly_rate ?? 0
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    guests: 2,
    durationHours: 2,
    serviceAddress: "",
    serviceCity: "",
    serviceState: "",
    serviceZipCode: "",
    serviceType: "personal_meal",
    special_requests: "",
  })
  const totalPrice = basePrice * (formData.durationHours || 2)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        chefId: chef.id,
        eventDate: formData.date,
        eventTime: formData.time,
        guestCount: Number(formData.guests),
        durationHours: Number(formData.durationHours),
        serviceAddress: formData.serviceAddress,
        serviceCity: formData.serviceCity,
        serviceState: formData.serviceState,
        serviceZipCode: formData.serviceZipCode,
        serviceType: formData.serviceType,
        specialRequests: formData.special_requests || undefined,
      }

      const createdBooking = await createBooking(payload)
      setBooking(createdBooking)
      setStep(2)
      setBanner({ type: "success", message: "Booking details confirmed! Proceed to payment." })
    } catch (error) {
      console.error("[Foodie] Error creating booking:", error)
      setBanner({ type: "error", message: "Failed to create booking. Tafadhali jaribu tena." })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setBanner({ type: "success", message: "Payment successful! Your booking is confirmed." })
    onClose()
    setStep(1)
    setBooking(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-md p-6 relative text-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>

        {banner && (
          <div
            role="status"
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${banner.type === "success" ? "bg-green-900/40 text-green-200" : "bg-red-900/40 text-red-200"
              }`}
          >
            {banner.message}
          </div>
        )}

        {step === 1 ? (
          <>
            <h2 className="text-2xl font-bold mb-6">Book with {chef.user?.full_name || 'Chef'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                  <Calendar size={20} className="text-gray-500" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="bg-transparent outline-none flex-1 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Time</label>
                <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                  <Clock size={20} className="text-gray-500" />
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="bg-transparent outline-none flex-1 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Number of Guests</label>
                <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                  <Users size={20} className="text-gray-500" />
                  <input
                    type="number"
                    name="guests"
                    value={formData.guests}
                    onChange={handleInputChange}
                    min="1"
                    className="bg-transparent outline-none flex-1 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Duration (hours)</label>
                <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                  <Clock size={20} className="text-gray-500" />
                  <input
                    type="number"
                    name="durationHours"
                    value={formData.durationHours}
                    onChange={handleInputChange}
                    min="1"
                    max="12"
                    className="bg-transparent outline-none flex-1 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Service Type</label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="personal_meal">Personal Meal</option>
                  <option value="event_catering">Event Catering</option>
                  <option value="cooking_class">Cooking Class</option>
                  <option value="meal_prep">Meal Prep</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Service Address</label>
                <input
                  type="text"
                  name="serviceAddress"
                  value={formData.serviceAddress}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
                  <input
                    type="text"
                    name="serviceCity"
                    value={formData.serviceCity}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">State</label>
                  <input
                    type="text"
                    name="serviceState"
                    value={formData.serviceState}
                    onChange={handleInputChange}
                    placeholder="State"
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Zip Code</label>
                <input
                  type="text"
                  name="serviceZipCode"
                  value={formData.serviceZipCode}
                  onChange={handleInputChange}
                  placeholder="Zip/Postal code"
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Special Requests</label>
                <textarea
                  name="special_requests"
                  value={formData.special_requests}
                  onChange={handleInputChange}
                  placeholder="Any dietary restrictions, allergies, menu preferences..."
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Booking..." : "Continue to Payment"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
            <p className="text-gray-400 mb-4">Total: KES {Number(booking?.total_amount ?? booking?.base_price ?? totalPrice).toFixed(2)}</p>
            {booking ? (
              <MpesaPaymentForm booking={booking} onSuccess={handlePaymentSuccess} />
            ) : (
              <p className="text-sm text-red-300">Hatukuweza kupakia maelezo ya booking. Tafadhali rudi nyuma ujaribu tena.</p>
            )}
            <button onClick={() => setStep(1)} className="w-full mt-4 text-gray-400 hover:text-white transition">
              Back to Booking Details
            </button>
          </>
        )}
      </div>
    </div>
  )
}
