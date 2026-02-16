'use client'

import React from 'react'
import { useOnboarding } from '@/context/onboarding-context'
import { Button } from '@/components/ui/button'
import { Clock, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function AvailabilityStep() {
  const { data, updateData, nextStep } = useOnboarding()

  const toggleDay = (day: string) => {
    const current = data.weeklySchedule
    if (current.includes(day)) {
      updateData({ weeklySchedule: current.filter(d => d !== day) })
    } else {
      updateData({ weeklySchedule: [...current, day] })
    }
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Availability Rules</h1>
        <p className="text-white/40 font-medium text-xs sm:text-base">Phase 03: Your Kitchen Hours</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 ml-1">Current Base (City)</label>
          <input
            type="text"
            required
            value={data.location}
            onChange={(e) => updateData({ location: e.target.value })}
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-white/20 font-bold text-sm"
            placeholder="e.g. Nairobi, Kenya"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => updateData({ availabilityType: 'always' })}
            className={`p-6 rounded-[2rem] border text-left transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${
              data.availabilityType === 'always'
                ? 'bg-white/10 border-accent shadow-glow'
                : 'bg-white/5 border-white/5 hover:border-white/20'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
              data.availabilityType === 'always' ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/20'
            }`}>
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg mb-1">On Demand</h3>
            <p className="text-xs text-white/40 leading-relaxed font-medium">I'm generally available but need 48h notice for bookings.</p>
            {data.availabilityType === 'always' && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent shadow-glow" />
            )}
          </button>

          <button
            onClick={() => updateData({ availabilityType: 'fixed' })}
            className={`p-6 rounded-[2rem] border text-left transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${
              data.availabilityType === 'fixed'
                ? 'bg-white/10 border-accent shadow-glow'
                : 'bg-white/5 border-white/5 hover:border-white/20'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
              data.availabilityType === 'fixed' ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/20'
            }`}>
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg mb-1">Fixed Schedule</h3>
            <p className="text-xs text-white/40 leading-relaxed font-medium">I have specific days and times I'm available each week.</p>
            {data.availabilityType === 'fixed' && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent shadow-glow" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {data.availabilityType === 'fixed' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 px-1 ml-1">Select your working days</label>
              <div className="flex flex-wrap gap-2.5">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex-1 min-w-[60px] py-4 rounded-xl text-xs font-black border transition-all ${
                      data.weeklySchedule.includes(day)
                        ? 'bg-accent border-accent text-white shadow-glow'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/20 text-center uppercase tracking-widest font-black italic">
                You can fine-tune specific hours after going live.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button 
          onClick={nextStep}
          disabled={data.availabilityType === 'fixed' && data.weeklySchedule.length === 0}
          className="w-full h-16 text-lg font-black bg-white text-black hover:bg-white/90 rounded-2xl shadow-glow transition-all active:scale-[0.98] disabled:opacity-20 disabled:grayscale"
        >
          Continue to Terms
        </Button>
      </div>
    </div>
  )
}
