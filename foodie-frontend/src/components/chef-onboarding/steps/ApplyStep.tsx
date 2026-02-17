'use client'

import React from 'react'
import { useOnboarding } from '@/context/onboarding-context'
import { Button } from '@/components/ui/button'

const CUISINES = [
  'Italian', 'French', 'Japanese', 'Mexican', 'Indian', 
  'Mediterranean', 'Thai', 'Chinese', 'Korean', 'American Modern'
]

export default function ApplyStep() {
  const { data, updateData, nextStep } = useOnboarding()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  const toggleCuisine = (cuisine: string) => {
    const current = data.cuisineStrengths
    if (current.includes(cuisine)) {
      updateData({ cuisineStrengths: current.filter(c => c !== cuisine) })
    } else {
      updateData({ cuisineStrengths: [...current, cuisine] })
    }
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Your Culinary Identity</h1>
        <p className="text-white/40 font-medium text-xs sm:text-base">Phase 01: Cuisine Strengths</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-10">
          <div className="space-y-6">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 ml-1">Select your specialties</label>
            <div className="flex flex-wrap gap-3">
              {CUISINES.map((cuisine) => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => toggleCuisine(cuisine)}
                  className={`px-6 py-3.5 rounded-2xl text-xs font-black border transition-all duration-300 active:scale-[0.95] ${
                    data.cuisineStrengths.includes(cuisine)
                      ? 'bg-accent border-accent text-white shadow-glow'
                      : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-black italic">
              You can add more specialized cuisines to your profile later.
            </p>
          </div>
        </div>

        <Button type="submit" className="w-full h-16 text-lg font-black bg-white text-black hover:bg-white/90 rounded-2xl shadow-glow transition-all active:scale-[0.98]">
          Continue to Expertise
        </Button>
      </form>
    </div>
  )
}
