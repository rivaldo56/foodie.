'use client';
import { Suspense } from 'react';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, ArrowLeft, CreditCard, CheckCircle2, 
  Smartphone, ShieldCheck, Lock, AlertCircle
} from 'lucide-react';
import { initiateMpesaPayment, checkPaymentStatus } from '@/services/payment.service';

type Menu = {
  id: string;
  name: string;
  price_per_person: number;
  image_url: string | null;
  experience: { name: string; image_url: string | null };
};

function PaymentPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const menuId = params.menuId as string;
  const bookingId = searchParams.get('booking_id');
  const amount = Number(searchParams.get('amount') || 0);

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mpesa'>('mpesa');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'pending' | 'success' | 'error', message: string }>({ 
    type: 'idle', 
    message: '' 
  });

  // M-Pesa State
  const [phoneNumber, setPhoneNumber] = useState('');

  // Card State (Mock)
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data, error } = await supabase
          .from('menus')
          .select('*, experience:experiences(name, image_url)')
          .eq('id', menuId)
          .single();
        
        if (error) throw error;
        setMenu(data as any);
      } catch (err) {
        console.error('Error fetching menu for payment:', err);
      } finally {
        setLoading(false);
      }
    }
    if (menuId) fetchMenu();
  }, [menuId]);

  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;
    
    setProcessing(true);
    setStatus({ type: 'pending', message: 'Sending M-Pesa prompt...' });

    try {
      const result = await initiateMpesaPayment(bookingId, phoneNumber);
      if (result.error || !result.data) throw new Error(result.error || 'Failed to initiate M-Pesa payment');
      
      const mpesaPaymentId = result.data.mpesa_payment_id;
      if (!mpesaPaymentId) throw new Error('No payment ID returned');

      setStatus({ type: 'pending', message: 'Prompt sent! Enter PIN on your phone to complete.' });

      // Poll for status
      const pollStatus = async () => {
        try {
          const res = await checkPaymentStatus(mpesaPaymentId);
          if (res.data?.status === 'completed') {
            setStatus({ type: 'success', message: 'Payment confirmed! Redirecting...' });
            setTimeout(() => {
              router.push(`/bookings/confirmation?booking_id=${bookingId}`);
            }, 2000);
          } else if (res.data?.status === 'failed') {
            setStatus({ type: 'error', message: 'Payment failed or cancelled.' });
            setProcessing(false);
          } else {
            setTimeout(pollStatus, 3000); // Check again in 3s
          }
        } catch (err) {
          console.error('Polling error:', err);
          setTimeout(pollStatus, 3000);
        }
      };
      
      pollStatus();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Something went wrong.' });
      setProcessing(false);
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setStatus({ type: 'pending', message: 'Processing card payment...' });

    // Simulate delay
    setTimeout(() => {
      setStatus({ type: 'success', message: 'Payment successful! Securely processing booking...' });
      setTimeout(() => {
        router.push(`/bookings/confirmation?booking_id=${bookingId}`);
      }, 2000);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0c0a] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white pt-24 px-4 pb-20">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Left Side: Summary */}
        <div className="space-y-6">
          <button onClick={() => router.back()} className="flex items-center text-white/40 hover:text-white transition-colors group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to details
          </button>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Final Step: Secure Deposit</h1>
            <p className="text-white/60 leading-relaxed">
              To hold your slot and start matching with a chef, a 30% refundable deposit is required.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-2xl">
            <div className="aspect-video relative">
              <Image 
                src={menu?.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=800&q=80'} 
                alt={menu?.name || 'Menu'} 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-6">
                <p className="text-accent text-xs font-bold uppercase tracking-widest mb-1">{menu?.experience?.name}</p>
                <p className="text-xl font-bold">{menu?.name}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-white/70">
                <span className="text-sm">30% Deposit Due</span>
                <span className="text-xl font-bold text-white">KES {amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/50 leading-snug">
                <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                Your funds are held in escrow. If no chef accepts your booking within 15 minutes, you'll be automatically refunded.
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl h-fit">
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 mb-8">
            <button 
              onClick={() => setPaymentMethod('mpesa')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${paymentMethod === 'mpesa' ? 'bg-accent text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <Smartphone className="h-4 w-4" />
              <span className="text-sm font-bold">M-Pesa</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${paymentMethod === 'card' ? 'bg-accent text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-bold">Card</span>
            </button>
          </div>

          {status.type !== 'idle' && (
            <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              'bg-accent/10 border-accent/20 text-accent'
            }`}>
              {status.type === 'pending' ? <Loader2 className="h-5 w-5 animate-spin" /> : 
               status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : 
               <AlertCircle className="h-5 w-5" />}
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}

          {paymentMethod === 'mpesa' ? (
            <form onSubmit={handleMpesaPayment} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Phone Number</Label>
                <Input 
                  id="phone"
                  type="tel"
                  placeholder="2547XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 focus:ring-accent focus:border-accent text-lg"
                  required
                  disabled={processing}
                />
                <p className="text-[10px] text-white/30 ml-1 leading-relaxed">
                  Enter your M-Pesa phone number exactly. You'll get a popup on your screen to enter your PIN.
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={processing || !phoneNumber}
                className="w-full h-16 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold text-lg shadow-glow transition-all"
              >
                {processing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Pay KES {amount.toLocaleString()}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCardPayment} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-name" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Cardholder Name</Label>
                  <Input 
                    id="card-name"
                    placeholder="JAMAL MWANGI"
                    className="bg-white/5 border-white/10 h-14 rounded-2xl px-6"
                    required
                    disabled={processing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-num" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Card Number</Label>
                  <div className="relative">
                    <Input 
                      id="card-num"
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 pr-12"
                      required
                      disabled={processing}
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-exp" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Expiry Date</Label>
                    <Input id="card-exp" placeholder="MM/YY" className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-center" required disabled={processing}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-cvv" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">CVV</Label>
                    <Input id="card-cvv" placeholder="123" type="password" maxLength={3} className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-center" required disabled={processing}/>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={processing}
                className="w-full h-16 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold text-lg shadow-glow transition-all"
              >
                {processing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Pay KES {amount.toLocaleString()}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4 text-center">
            <p className="text-[11px] text-white/30 flex items-center justify-center gap-2">
              <Lock className="h-3 w-3" />
              Secure payments powered by Foodie Pay
            </p>
            <div className="flex gap-4 opacity-20 grayscale">
              <Image src="/visa-logo.png" alt="Visa" width={32} height={32} className="h-4 w-auto object-contain" />
              <div className="w-px h-4 bg-white/20" />
              <Image src="/mastercard-logo.png" alt="Mastercard" width={32} height={32} className="h-4 w-auto object-contain" />
              <div className="w-px h-4 bg-white/20" />
              <Image src="/mpesa-logo.png" alt="M-Pesa" width={40} height={40} className="h-4 w-auto object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
