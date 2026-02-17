'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useOnboarding } from '@/context/onboarding-context'
import { Button } from '@/components/ui/button'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

const SLA_RULES = [
  { title: 'Response Time', detail: 'Founding 50 chefs must respond to booking inquiries within 2 hours.' },
  { title: 'Reliability', detail: 'Zero-tolerance for no-shows. Cancellations must be made 72h in advance.' },
  { title: 'Hygiene & Safety', detail: 'Follow all local food safety regulations and hygiene standards.' },
  { title: 'Payment Integrity', detail: 'All payments must be processed through the Foodie platform.' },
  { title: 'Professionalism', detail: 'Chefs must maintain high professionalism and service quality.' }
]

export default function SLAStep() {
  const { data, updateData, nextStep } = useOnboarding()
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasScrolledToBottom(true)
      }
    }
  }

  // Auto-scroll logic is just for demo, usually we want users to actually scroll
  useEffect(() => {
    handleScroll()
  }, [])

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Quality Standards</h1>
        <p className="text-white/40 font-medium text-xs sm:text-base">Phase 04: The Professional Pact</p>
      </div>

      <div className="space-y-10">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="bg-white/5 border border-white/10 rounded-[2rem] p-8 max-h-[350px] overflow-y-auto space-y-8 custom-scrollbar group relative"
        >
          <div className="flex items-start gap-4 p-5 bg-accent/10 border border-accent/20 rounded-2xl mb-2">
            <ShieldAlert className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-accent uppercase tracking-widest mb-1">Founding 50 Protocol</p>
              <p className="text-xs text-accent/80 leading-relaxed font-medium">
                Our early adopters are held to the highest standards of culinary excellence and professionalism.
              </p>
            </div>
          </div>

          {SLA_RULES.map((rule, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="font-black text-white text-sm flex items-center gap-3 uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                </div>
                {rule.title}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed pl-9 font-medium">{rule.detail}</p>
            </div>
          ))}

          <div className="pt-6 border-t border-white/5">
            <p className="text-[10px] text-white/20 leading-relaxed uppercase font-black tracking-widest">
              Upholding these standards is mandatory for membership in the Founding 50 program.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {!hasScrolledToBottom && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-accent animate-pulse"
            >
              Scroll to base to unlock agreement
            </motion.p>
          )}

          <div 
            className={`flex items-start gap-4 p-6 rounded-2xl border transition-all duration-500 ${
              !hasScrolledToBottom ? 'opacity-20 grayscale cursor-not-allowed border-white/5' : 'bg-white/5 border-white/10 cursor-pointer hover:bg-white/10'
            }`}
            onClick={() => hasScrolledToBottom && updateData({ slaAccepted: !data.slaAccepted })}
          >
            <div className="relative flex items-center">
              <input
                id="sla"
                type="checkbox"
                checked={data.slaAccepted}
                disabled={!hasScrolledToBottom}
                onChange={(e) => updateData({ slaAccepted: e.target.checked })}
                className="w-6 h-6 rounded-lg border-white/10 bg-white/5 text-accent focus:ring-accent transition-all cursor-pointer accent-accent"
              />
            </div>
            <label 
              htmlFor="sla" 
              className={`text-xs font-bold leading-relaxed cursor-pointer ${!hasScrolledToBottom ? 'text-white/20' : 'text-white/60'}`}
            >
              I solemnly swear to uphold the Founding 50 Service Level Agreement and platform integrity.
            </label>
          </div>

          <Button 
            onClick={nextStep}
            disabled={!data.slaAccepted}
            className="w-full h-16 text-lg font-black bg-white text-black hover:bg-white/90 rounded-2xl shadow-glow transition-all active:scale-[0.98] disabled:opacity-20 disabled:grayscale"
          >
            I Accept These Terms
          </Button>
        </div>
      </div>
    </div>
  )
}
