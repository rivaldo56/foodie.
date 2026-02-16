'use client'

import React, { useState } from 'react'
import { useOnboarding } from '@/context/onboarding-context'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Image as ImageIcon, CheckCircle2, Loader2, X } from 'lucide-react'

type UploadType = 'idFront' | 'idBack' | 'certificate' | 'portfolio'

export default function VerificationStep() {
  const { data, updateData, nextStep } = useOnboarding()
  const [uploading, setUploading] = useState<UploadType | null>(null)

  const simulateUpload = (type: UploadType) => {
    setUploading(type)
    setTimeout(() => {
      if (type === 'portfolio') {
        const fakeUrl = `https://images.unsplash.com/photo-${Math.random()}`
        updateData({ portfolioUrls: [...data.portfolioUrls, fakeUrl] })
      } else if (type === 'idFront') {
        updateData({ idFrontUrl: 'id-front' })
      } else if (type === 'idBack') {
        updateData({ idBackUrl: 'id-back' })
      } else if (type === 'certificate') {
        updateData({ foodCertificateUrl: 'certificate' })
      }
      setUploading(null)
    }, 1500)
  }

  const removePortfolio = (url: string) => {
    updateData({ portfolioUrls: data.portfolioUrls.filter(u => u !== url) })
  }

  const isComplete = data.idFrontUrl && data.idBackUrl && data.foodCertificateUrl && data.portfolioUrls.length >= 3

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Identity & Skills</h1>
        <p className="text-white/40 font-medium text-xs sm:text-base">Phase 05: Trust & Verification</p>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4 text-center sm:text-left">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 px-1 ml-1">Government ID (Front)</label>
            <button
              onClick={() => simulateUpload('idFront')}
              disabled={!!uploading}
              className={`w-full aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 active:scale-[0.98] ${
                data.idFrontUrl 
                  ? 'border-accent/40 bg-accent/5 text-accent shadow-glow' 
                  : 'border-white/5 bg-white/5 hover:border-white/20 text-white/20'
              }`}
            >
              {uploading === 'idFront' ? <Loader2 className="w-8 h-8 animate-spin" /> : 
               data.idFrontUrl ? <CheckCircle2 className="w-8 h-8 animate-in zoom-in" /> : <Upload className="w-8 h-8" />}
              <span className="text-[10px] mt-4 font-black uppercase tracking-widest leading-none">
                {data.idFrontUrl ? 'Verified' : 'Upload front'}
              </span>
            </button>
          </div>

          <div className="space-y-4 text-center sm:text-left">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 px-1 ml-1">Government ID (Back)</label>
            <button
              onClick={() => simulateUpload('idBack')}
              disabled={!!uploading}
              className={`w-full aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 active:scale-[0.98] ${
                data.idBackUrl 
                  ? 'border-accent/40 bg-accent/5 text-accent shadow-glow' 
                  : 'border-white/5 bg-white/5 hover:border-white/20 text-white/20'
              }`}
            >
              {uploading === 'idBack' ? <Loader2 className="w-8 h-8 animate-spin" /> : 
               data.idBackUrl ? <CheckCircle2 className="w-8 h-8 animate-in zoom-in" /> : <Upload className="w-8 h-8" />}
              <span className="text-[10px] mt-4 font-black uppercase tracking-widest leading-none">
                {data.idBackUrl ? 'Verified' : 'Upload back'}
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-4 text-center sm:text-left">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 px-1 ml-1">Certification (Health/Safety)</label>
          <button
            onClick={() => simulateUpload('certificate')}
            disabled={!!uploading}
            className={`w-full p-8 rounded-[2rem] border-2 border-dashed flex items-center justify-between transition-all duration-300 active:scale-[0.98] ${
              data.foodCertificateUrl 
                ? 'border-accent/40 bg-accent/5 text-accent shadow-glow' 
                : 'border-white/5 bg-white/5 hover:border-white/20 text-white/20'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.foodCertificateUrl ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/10'}`}>
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black uppercase tracking-widest block text-white/80">Health Certificate</span>
                <span className="text-[10px] font-bold text-white/20 block">Required for legal compliance</span>
              </div>
            </div>
            {uploading === 'certificate' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
             data.foodCertificateUrl ? <CheckCircle2 className="w-5 h-5 animate-in zoom-in" /> : <Upload className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 ml-1">Chef Portfolio (Min. 3)</label>
            <span className={`text-[10px] font-black uppercase tracking-widest ${data.portfolioUrls.length >= 3 ? 'text-accent' : 'text-white/20'}`}>
              {data.portfolioUrls.length} / 3 Uploaded
            </span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {data.portfolioUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-[1.25rem] overflow-hidden group border border-white/10">
                <img src={url} alt={`Portfolio ${idx}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                <button 
                  onClick={() => removePortfolio(url)}
                  className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur hover:bg-black"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {data.portfolioUrls.length < 6 && (
              <button
                onClick={() => simulateUpload('portfolio')}
                disabled={!!uploading}
                className="aspect-square rounded-[1.25rem] border-2 border-dashed border-white/5 bg-white/5 hover:border-white/20 flex flex-col items-center justify-center transition-all duration-300 active:scale-[0.95] text-white/10"
              >
                {uploading === 'portfolio' ? <Loader2 className="w-6 h-6 animate-spin text-accent" /> : <Upload className="w-6 h-6 group-hover:text-white" />}
              </button>
            )}
          </div>
        </div>

        <Button 
          onClick={nextStep}
          disabled={!isComplete}
          className="w-full h-16 text-lg font-black bg-white text-black hover:bg-white/90 rounded-2xl shadow-glow transition-all active:scale-[0.98] disabled:opacity-20 disabled:grayscale"
        >
          {isComplete ? 'Continue to Discovery Run' : 'Complete Documents First'}
        </Button>
      </div>
    </div>
  )
}
