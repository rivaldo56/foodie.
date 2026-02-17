'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { chefService } from '../services/chef.service'

export type OnboardingData = {
  fullName: string
  email: string
  phone: string
  cuisineStrengths: string[]
  location: string
  experiences: string[]
  guestCapacity: number
  priceTier: string
  travelRadius: number
  availabilityType: 'always' | 'fixed'
  weeklySchedule: string[]
  slaAccepted: boolean
  idFrontUrl?: string
  idBackUrl?: string
  foodCertificateUrl?: string
  portfolioUrls: string[]
  dryRunAccepted: boolean
}

const initialData: OnboardingData = {
  fullName: '',
  email: '',
  phone: '',
  cuisineStrengths: [],
  location: '',
  experiences: [],
  guestCapacity: 10,
  priceTier: '$$',
  travelRadius: 10,
  availabilityType: 'always',
  weeklySchedule: [],
  slaAccepted: false,
  portfolioUrls: [],
  dryRunAccepted: false,
}

type OnboardingContextType = {
  step: number
  data: OnboardingData
  setStep: (step: number) => void
  updateData: (newData: Partial<OnboardingData>) => void
  nextStep: () => void
  prevStep: () => void
  finishOnboarding: () => Promise<{ success: boolean; error?: string }>
  isSubmitting: boolean
  error: string | null
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(initialData)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateData = (newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }))
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 7))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const finishOnboarding = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await chefService.completeOnboarding(data)
      if (response.error) {
        throw new Error(response.error)
      }
      return { success: true }
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding')
      return { success: false, error: err.message }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        step,
        data,
        setStep,
        updateData,
        nextStep,
        prevStep,
        finishOnboarding,
        isSubmitting,
        error
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
