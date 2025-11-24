"use client"

import { useEffect } from "react"
import Link from "next/link"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[Foodie] Uncaught application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl bg-gray-900/90 border border-gray-700/60 shadow-glow p-8 space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Oops! Something went wrong</h1>
        <p className="text-sm text-gray-300">
          Tumepata hitilafu isiyotarajiwa. Tafadhali jaribu tena au rudi kwenye ukurasa wa mwanzo.
        </p>
        {error?.message && (
          <p className="text-xs text-orange-200/80 bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-2">
            {error.message}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 transition text-white font-medium py-3"
          >
            Jaribu tena
          </button>
          <Link
            href="/"
            className="w-full rounded-full bg-gray-800 hover:bg-gray-700 transition text-white font-medium py-3"
          >
            Rudi kwenye Mwanzo
          </Link>
        </div>

        {error?.digest && <p className="text-[10px] text-gray-500">Reference: {error.digest}</p>}
      </div>
    </div>
  )
}
