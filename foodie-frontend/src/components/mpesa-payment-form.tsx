"use client"

import type React from "react"

import { useState } from "react"
import { mpesaApi } from "@/lib/api/mpesa"
import type { Booking } from "@/lib/api"

interface MpesaPaymentFormProps {
  booking: Booking
  onSuccess: () => void
}

export default function MpesaPaymentForm({ booking, onSuccess }: MpesaPaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ tone: "info" | "success" | "error"; text: string } | null>(
    null,
  )

  const amount = booking.total_amount ?? booking.base_price ?? 0
  const bookingId = String(booking.id)

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await mpesaApi.initiatePayment(amount, bookingId, phoneNumber)
      setTransactionId(response.transaction_id)

      setStatusMessage({
        tone: "info",
        text: "M-Pesa prompt sent to your phone. Enter your PIN to complete payment.",
      })

      // Poll for payment confirmation
      const checkStatus = async () => {
        try {
          const status = await mpesaApi.checkPaymentStatus(response.transaction_id)
          if (status.status === "completed") {
            setStatusMessage({ tone: "success", text: "Payment successful!" })
            onSuccess()
          } else if (status.status === "failed") {
            setStatusMessage({ tone: "error", text: "Payment failed. Please try again." })
          } else {
            // Still pending, check again in 2 seconds
            setTimeout(checkStatus, 2000)
          }
        } catch (error) {
          console.error("[v0] Status check error:", error)
        }
      }

      setTimeout(checkStatus, 2000)
    } catch (error) {
      console.error("[v0] Payment error:", error)
      setStatusMessage({ tone: "error", text: "Failed to initiate payment. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
        <input
          type="tel"
          placeholder="254712345678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Enter your M-Pesa registered phone number</p>
      </div>

      <div className="bg-blue-900 border border-blue-700 rounded-lg p-3">
        <p className="text-sm text-blue-200">
          You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment of KES{" "}
          {amount.toFixed(2)}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Processing..." : `Pay KES ${amount.toFixed(2)} via M-Pesa`}
      </button>

      {statusMessage && (
        <p
          className={`text-xs ${
            statusMessage.tone === "error"
              ? "text-red-400"
              : statusMessage.tone === "success"
              ? "text-green-400"
              : "text-blue-300"
          }`}
        >
          {statusMessage.text}
        </p>
      )}

      {transactionId && <p className="text-xs text-gray-500 text-center">Transaction ID: {transactionId}</p>}
    </form>
  )
}
