'use client'

import React from 'react'
import { useOnboarding } from '@/context/onboarding-context'
import { Button } from '@/components/ui/button'
import { Utensils, Users, DollarSign, MapPin } from 'lucide-react'

const EXPERIENCE_TYPES = [
  { id: 'private', label: 'Private Dinner', icon: Utensils, description: 'Intimate multi-course meals at home' },
  { id: 'popup', label: 'Pop-up Event', icon: Users, description: 'Themed nights at unique venues' },
  { id: 'mealprep', label: 'Meal Prep', icon: Utensils, description: 'Weekly healthy meals for busy clients' },
  { id: 'catering', label: 'Catering', icon: Users, description: 'Large events and office gatherings' },
]

export default function ExperienceStep() {
  const { data, updateData, nextStep } = useOnboarding()

  const toggleExperience = (id: string) => {
    const current = data.experiences
    if (current.includes(id)) {
      updateData({ experiences: current.filter(e => e !== id) })
    } else {
      updateData({ experiences: [...current, id] })
    }
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Experience & Gear</h1>
        <p className="text-white/40 font-medium text-xs sm:text-base">Phase 02: Your Culinary Depth</p>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXPERIENCE_TYPES.map((exp) => (
            <button
              key={exp.id}
              onClick={() => toggleExperience(exp.id)}
              className={`p-6 rounded-[2rem] border text-left transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${
                data.experiences.includes(exp.id)
                  ? 'bg-white/10 border-accent shadow-glow'
                  : 'bg-white/5 border-white/5 hover:border-white/20'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                data.experiences.includes(exp.id) ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/20'
              }`}>
                <exp.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">{exp.label}</h3>
              <p className="text-xs text-white/40 leading-relaxed font-medium">{exp.description}</p>
              
              {data.experiences.includes(exp.id) && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent shadow-glow" />
              )}
            </button>
          ))}
        </div>

        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 flex items-center gap-2">
                <Users className="w-3 h-3 text-accent" /> Max Guest Capacity
              </label>
              <span className="text-accent font-black text-sm">{data.guestCapacity} <span className="text-[10px] text-white/20 uppercase ml-1">Guests</span></span>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full px-1">
              <input
                type="range"
                min="1"
                max="50"
                value={data.guestCapacity}
                onChange={(e) => updateData({ guestCapacity: parseInt(e.target.value) })}
                className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer accent-accent transition-all hover:accent-accent-strong"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-12">
            <div className="space-y-6">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 px-1 flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-accent" /> Price Tier
              </label>
              <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                {['$', '$$', '$$$'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => updateData({ priceTier: tier })}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                      data.priceTier === tier
                        ? 'bg-white text-black shadow-glow'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 px-1 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-accent" /> Travel Radius (km)
              </label>
              <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                {[5, 10, 20, 50].map((radius) => (
                  <button
                    key={radius}
                    onClick={() => updateData({ travelRadius: radius })}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                      data.travelRadius === radius
                        ? 'bg-white text-black shadow-glow'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {radius}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={nextStep}
          disabled={data.experiences.length === 0}
          className="w-full h-16 text-lg font-black bg-white text-black hover:bg-white/90 rounded-2xl shadow-glow transition-all active:scale-[0.98] disabled:opacity-20 disabled:grayscale"
        >
          Continue to Schedule
        </Button>
      </div>
    </div>
  )
}
