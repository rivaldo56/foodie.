'use client'

import React, { useEffect } from 'react'
import { useOnboarding } from '@/context/onboarding-context'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { CheckCircle2, Star, Rocket, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'

import Link from 'next/link'

export default function GoLiveStep() {
  const { data, finishOnboarding, isSubmitting, error } = useOnboarding()
  const [submitted, setSubmitted] = React.useState(false)

  useEffect(() => {
    const triggerSubmit = async () => {
      if (!submitted) {
        await finishOnboarding()
        setSubmitted(true)
      }
    }
    triggerSubmit()

    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center space-y-10 py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-white/5 rounded-full" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-24 h-24 border-4 border-accent border-t-transparent rounded-full shadow-glow" 
          />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-white tracking-tight">Syncing Profile...</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black italic">Connecting you to the Foodie Map</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-20 text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="p-8 bg-accent/5 border border-accent/20 rounded-[2.5rem] text-accent max-w-sm">
          <p className="font-black text-xl mb-3 tracking-tight">Connection Lost</p>
          <p className="text-xs font-medium opacity-60 leading-relaxed mb-6">{error}</p>
          <Button onClick={() => finishOnboarding()} className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl">
            Retry Sync
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center space-y-8 sm:space-y-10 py-4 sm:py-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
        className="relative"
      >
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-tr from-accent to-orange-400 flex items-center justify-center shadow-glow">
          <Star className="w-14 h-14 sm:w-20 sm:h-20 text-white fill-white" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 bg-white text-black p-2 sm:p-3 rounded-xl sm:rounded-2xl border-4 border-[#050505] shadow-glow"
        >
          <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 font-black" />
        </motion.div>
      </motion.div>

      <div className="space-y-3 sm:space-y-4">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter">You're In, Chef.</h1>
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
            Founding 50 Verified
          </span>
        </div>
        <p className="text-white/40 text-sm sm:text-lg max-w-md mx-auto leading-relaxed font-medium">
          Welcome to the elite tier. Nairobi's dining scene just got a massive upgrade.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mt-4">
        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-left space-y-4 transition-all hover:border-white/20">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase tracking-wider text-xs">Early Access</h3>
            <p className="text-[10px] text-white/30 font-medium leading-relaxed mt-1">Priority status for all upcoming platform features.</p>
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-left space-y-4 transition-all hover:border-white/20">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase tracking-wider text-xs">Trust Badge</h3>
            <p className="text-[10px] text-white/30 font-medium leading-relaxed mt-1">Founding 50 Badge active on your public profile.</p>
          </div>
        </div>
      </div>

      <div className="w-full pt-10">
        <Link href="/chef/dashboard" className="w-full">
          <Button className="w-full h-20 text-xl font-black bg-white text-black hover:bg-white/90 rounded-[2rem] flex items-center justify-center gap-4 group shadow-glow transition-all active:scale-[0.98]">
            <span className="uppercase tracking-widest">Continue to Console</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
