"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Safely log the error without risking serialization crashes
    try {
      console.error("[Foodie] Uncaught application error:", error?.message || 'Unknown error', error);
    } catch (e) {
      console.error("[Foodie] Critical error logging failed");
    }
  }, [error]);

  const errorMessage = useMemo(() => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl bg-[#16181d] border border-white/5 shadow-2xl p-8 space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
          <AlertCircle className="h-8 w-8 text-orange-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-[#cbd5f5]">
            We encountered an unexpected error. Please try again or return to the home page.
          </p>
        </div>

        {errorMessage && (
          <div className="text-xs text-orange-200/80 bg-orange-500/5 border border-orange-500/20 rounded-2xl px-4 py-3 font-mono break-all">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 transition text-white font-semibold py-3 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-white font-medium py-3"
          >
            Back to Home
          </Link>
        </div>

        {error?.digest && <p className="text-[10px] text-gray-500/50">Ref: {error.digest}</p>}
      </div>
    </div>
  )
}
