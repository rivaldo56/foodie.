'use client'

import React, { useState } from 'react'
import { useOnboarding } from '@/context/onboarding-context'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, User, MapPin, Calendar, Clock, CreditCard, Check, X } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function DryRunStep() {
  const { data, updateData, nextStep } = useOnboarding()
  const [hasActed, setHasActed] = useState(false)
  const [action, setAction] = useState<'accept' | 'decline' | null>(null)

  const handleAccept = () => {
    setAction('accept')
    setHasActed(true)
    updateData({ dryRunAccepted: true })
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff7642', '#ffffff', '#4ade80']
    })
  }

  const handleDecline = () => {
    setAction('decline')
    setHasActed(true)
    updateData({ dryRunAccepted: false })
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">The Test Drive</h1>
        <p className="text-white/40 font-medium text-xs sm:text-base">Phase 06: Your First Booking</p>
      </div>

      <div className="space-y-8 sm:space-y-10">
        <AnimatePresence mode="wait">
          {!hasActed ? (
            <motion.div
              key="notification"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="bg-white/5 border border-accent/20 rounded-[2.5rem] p-10 shadow-glow overflow-hidden relative"
            >
              {/* Pulsing background effect */}
              <div className="absolute inset-0 bg-accent/5 animate-pulse pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-glow">
                    <Bell className="w-7 h-7 text-white animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xl tracking-tight">New Booking Alert!</h3>
                    <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em]">Founding 50 Beta Test</p>
                  </div>
                </div>

                <div className="space-y-6 mb-12">
                  <div className="flex items-center gap-5 p-6 bg-white/5 rounded-3xl border border-white/10">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/5 overflow-hidden">
                      <User className="w-8 h-8 text-white/20" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-lg">Sarah Jenkins</h4>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
                        Requested {data.experiences[0] || 'Private Dinner'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4">
                      <Calendar className="w-5 h-5 text-accent" />
                      <div>
                        <span className="text-[10px] font-black text-white/20 uppercase block tracking-widest">Date</span>
                        <span className="text-xs font-black text-white uppercase">Sat, Feb 14</span>
                      </div>
                    </div>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4">
                      <Clock className="w-5 h-5 text-accent" />
                      <div>
                        <span className="text-[10px] font-black text-white/20 uppercase block tracking-widest">Time</span>
                        <span className="text-xs font-black text-white uppercase">7:00 PM</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-white/40 font-bold text-xs uppercase tracking-widest">
                      <MapPin className="w-4 h-4" />
                      <span>2.4 km</span>
                    </div>
                    <div className="flex items-center gap-2 text-accent font-black text-lg">
                      <CreditCard className="w-5 h-5" />
                      <span>$240</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={handleDecline}
                    className="h-16 rounded-2xl border border-white/10 bg-white/5 text-white/40 font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-[0.98]"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAccept}
                    className="h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-glow hover:bg-white/90 transition-all active:scale-[0.98]"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-10 rounded-[2.5rem] border text-center relative overflow-hidden ${
                action === 'accept' ? 'bg-accent/5 border-accent/20 shadow-glow' : 'bg-white/5 border-white/10'
              }`}
            >
              <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-8 shadow-glow ${
                action === 'accept' ? 'bg-white text-black' : 'bg-white/5 text-white/20'
              }`}>
                {action === 'accept' ? <Check className="w-12 h-12" /> : <X className="w-12 h-12" />}
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
                {action === 'accept' ? 'LFG! The Hustle Begins' : 'Tactical Pass'}
              </h2>
              <p className="text-white/40 mb-10 leading-relaxed max-w-sm mx-auto font-medium">
                {action === 'accept' 
                  ? "That's the Founding 50 spirit. You've mastered the discovery layer. Now, let's make it official."
                  : "Respect. Knowing which gigs to take is part of being a pro. We'll show you how to manage filters later."}
              </p>
              <Button onClick={nextStep} className="w-full h-16 bg-white text-black hover:bg-white/90 font-black rounded-2xl shadow-glow transition-all active:scale-[0.98] uppercase tracking-widest text-xs">
                Go Live Now
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
