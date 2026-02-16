'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context'
import { chefService } from '@/services/chef.service'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import ApplyStep from '@/components/chef-onboarding/steps/ApplyStep'
import ExperienceStep from '@/components/chef-onboarding/steps/ExperienceStep'
import AvailabilityStep from '@/components/chef-onboarding/steps/AvailabilityStep'
import SLAStep from '@/components/chef-onboarding/steps/SLAStep'
import VerificationStep from '@/components/chef-onboarding/steps/VerificationStep'
import DryRunStep from '@/components/chef-onboarding/steps/DryRunStep'
import GoLiveStep from '@/components/chef-onboarding/steps/GoLiveStep'

const StepRenderer = () => {
  const { step } = useOnboarding()

  switch (step) {
    case 1:
      return <ApplyStep />
    case 2:
      return <ExperienceStep />
    case 3:
      return <AvailabilityStep />
    case 4:
      return <SLAStep />
    case 5:
      return <VerificationStep />
    case 6:
      return <DryRunStep />
    case 7:
      return <GoLiveStep />
    // Add other cases as we implement steps
    default:
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Step {step} Coming Soon</h2>
          <p className="text-muted mb-8">This part of the onboarding flow is under construction.</p>
        </div>
      )
  }
}

const ProgressBar = () => {
  const { step } = useOnboarding()
  const progress = (step / 7) * 100

  return (
    <div className="w-full h-1 bg-surface-elevated overflow-hidden">
      <motion.div
        className="h-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
    </div>
  )
}

const OnboardingLayout = () => {
  const { step, prevStep } = useOnboarding()

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-accent/30 selection:text-white">
      {/* Dynamic Background Noise/Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_-20%,#ff9e5a22,transparent_60%)]" />
      
      <main className="flex-1 relative flex items-center justify-center px-4 py-4 sm:py-8 overflow-hidden mt-8 sm:mt-0">
        {/* The Card Stack Container */}
        <div className="relative w-full max-w-[95vw] sm:max-w-2xl aspect-[3/4] sm:aspect-auto sm:min-h-[600px]">
          
          {/* Decorative Back Cards (The Stack Effect) */}
          <AnimatePresence>
            {step < 7 && (
              <>
                <motion.div 
                  className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] bg-surface-elevated/40 border border-white/5 scale-[0.94] translate-y-6 sm:translate-y-8 z-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
                <motion.div 
                  className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] bg-surface-elevated/60 border border-white/5 scale-[0.97] translate-y-3 sm:translate-y-4 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Active Card */}
          <AnimatePresence mode="popLayout" custom={step}>
            <motion.div
              key={step}
              custom={step}
              variants={{
                enter: (s: number) => ({
                  x: 0,
                  y: 20,
                  scale: 0.95,
                  opacity: 0,
                  rotate: 0,
                }),
                center: {
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: 1,
                  rotate: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }
                },
                exit: {
                  x: 500, // Shuffles sideways
                  y: 0,
                  scale: 0.9,
                  opacity: 0,
                  rotate: 15,
                  transition: {
                    duration: 0.4,
                    ease: [0.32, 0, 0.67, 0]
                  }
                }
              }}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 z-20"
            >
              <div className="w-full h-full glass-panel rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 p-6 sm:p-12 overflow-y-auto custom-scrollbar shadow-2xl relative">
                {/* Step indicator in card corner */}
                <div className="absolute top-6 right-6 sm:top-8 sm:right-8 flex items-center gap-2">
                   <div className="text-[8px] sm:text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Phase</div>
                   <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] sm:text-xs font-black bg-white/5">
                     0{step}
                   </div>
                </div>
                
                <StepRenderer />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-50 p-8 flex justify-center">
        <div className="flex items-center gap-4">
          {step > 1 && step < 7 && (
            <Button 
              variant="outline" 
              onClick={prevStep} 
              className="rounded-2xl h-14 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold"
            >
              Back
            </Button>
          )}
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s === step ? 'w-8 bg-accent' : s < step ? 'w-4 bg-accent/30' : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function OnboardingPage() {
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await chefService.getMyProfile()
        
        // If onboarding is complete, go to dashboard
        if (response.data && response.data.onboarding_step === 7) {
          router.push('/chef/dashboard')
        } else {
          setIsChecking(false)
        }
      } catch (err) {
        console.error("[Onboarding] Error checking profile status:", err)
        setIsChecking(false)
      }
    }
    checkStatus()
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-glow" />
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black italic animate-pulse">
            Authenticating Chef Profile...
          </p>
        </div>
      </div>
    )
  }

  return (
    <OnboardingProvider>
      <OnboardingLayout />
    </OnboardingProvider>
  )
}
