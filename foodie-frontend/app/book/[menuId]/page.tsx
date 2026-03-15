'use client';
// Force reload: 2026-03-14 20:10

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, ArrowLeft, Calendar, MapPin, Users, Navigation,
  ChefHat, CreditCard, Banknote, Clock, CheckCircle2, ShieldCheck, AlertCircle
} from 'lucide-react';
import { mealService } from '@/services/meal.service';

type Menu = {
  id: string;
  name: string;
  description: string;
  price_per_person: number;
  guest_min: number;
  guest_max: number;
  image_url: string | null;
  experience: { name: string; image_url: string | null };
  total_kcal?: number;
};

type BookingState = 'idle' | 'submitting' | 'failed';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = params.menuId as string;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bookingState, setBookingState] = useState<BookingState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [locating, setLocating] = useState(false);

  const [formData, setFormData] = useState({
    date_time: '',
    address: '',
    guests_count: 2,
    special_requests: '',
  });

  useEffect(() => {
    async function fetchData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      try {
        console.log('[BOOKING_PAGE] Fetching data for menu:', menuId);
        const [menuRes, mealsRes] = await Promise.all([
          supabase.from('menus').select(`
            *,
            experience:experiences ( name, image_url )
          `).eq('id', menuId).single(),
          mealService.getMenuMeals(menuId),
        ]);
        
        if (menuRes.error) throw menuRes.error;
        if (!menuRes.data) throw new Error('Menu not found');

        setMenu(menuRes.data as any);
        setMeals(mealsRes.data || []);
        
        if (menuRes.data) {
          const minGuests = menuRes.data.guest_min || 2;
          setFormData(prev => ({ ...prev, guests_count: minGuests }));
        }
      } catch (err: any) {
        console.error('[BOOKING_PAGE] Fetch error:', err);
        setErrorMsg('Could not load menu details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    if (menuId) fetchData();
  }, [menuId]);

  const calculateTotal = () => (!menu ? 0 : menu.price_per_person * (formData.guests_count || 0));
  const calculatePrepAdvance = () => Math.round(calculateTotal() * 0.25 * 100) / 100;

  const handleShareLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const data = await res.json();
        setFormData(prev => ({ ...prev, address: data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}` }));
      } catch { setFormData(prev => ({ ...prev, address: `${pos.coords.latitude}, ${pos.coords.longitude}` })); }
      finally { setLocating(false); }
    }, () => { alert('Unable to retrieve your location'); setLocating(false); });
  };

  const handleBookingFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[BOOKING] Initiating new Paystack booking flow...');
    
    if (!user) { 
      router.push('/login?next=/book/' + menuId); 
      return; 
    }

    if (!menu) {
      setErrorMsg('Menu data is still loading. Please wait.');
      return;
    }

    if (!formData.date_time) {
      setErrorMsg('Please select a preferred date and time.');
      return;
    }

    const bookingDate = new Date(formData.date_time);
    if (isNaN(bookingDate.getTime())) {
      setErrorMsg('The selected date is invalid. Please pick another one.');
      return;
    }

    if (isNaN(formData.guests_count) || formData.guests_count < 1) {
      setErrorMsg('Please enter a valid number of guests.');
      return;
    }

    if (!formData.address || formData.address.length < 5) {
      setErrorMsg('Please enter a more specific location address.');
      return;
    }

    setBookingState('submitting');
    setErrorMsg('');

    try {
      console.log('[BOOKING_SUBMIT] Invoking create-booking edge function...');
      
      const { data: result, error: invokeError } = await supabase.functions.invoke('create-booking', {
        body: {
          menu_id: menuId,
          date_time: bookingDate.toISOString(),
          address: formData.address,
          guests_count: Number(formData.guests_count),
          special_requests: formData.special_requests
        }
      });

      if (invokeError) throw invokeError;
      if (!result?.authorization_url) {
        throw new Error('Failed to get payment authorization from Paystack.');
      }

      console.log('[BOOKING_SUBMIT] Success, redirecting to Paystack:', result.authorization_url);
      window.location.href = result.authorization_url;

    } catch (error: any) {
      console.error('[BOOKING_SUBMIT_CRASH]', error);
      setErrorMsg(error.message || 'Something went wrong while processing your request.');
      setBookingState('failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0c0a]">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white space-y-4">
        <h1 className="text-2xl font-bold">Experience Unavailable</h1>
        <p className="text-white/60">This menu could not be loaded at this time.</p>
        <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white pb-20 pt-24 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-700">
        
        {/* Left Side: Summary */}
        <div className="space-y-8">
          <Link href={`/menus/${menuId}`} className="inline-flex items-center text-white/40 hover:text-white transition-colors mb-4 group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
            Back to menu
          </Link>

          <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
            <div className="relative h-64 w-full">
              <Image
                src={menu.image_url || menu.experience?.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=800&q=80'}
                alt={menu.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-accent text-xs font-bold uppercase tracking-widest mb-1">{menu.experience?.name}</p>
                <h1 className="text-3xl font-bold">{menu.name}</h1>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-white/70 leading-relaxed italic">"{menu.description}"</p>

              {meals.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {meals.slice(0, 3).map((m: any) => (
                    <div key={m.id} className="relative rounded-xl overflow-hidden aspect-square bg-white/5 border border-white/10">
                      <Image
                        src={m.meal?.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=400&q=80'}
                        alt={m.meal?.name || m.course_type} fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-[10px] font-bold truncate uppercase">{m.meal?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Price per Guest</p>
                  <p className="text-2xl font-black">KES {menu.price_per_person.toLocaleString()}</p>
                </div>
                {menu.total_kcal ? (
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Calories (Est.)</p>
                    <p className="text-white font-bold">{menu.total_kcal} kcal</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/2 p-6 space-y-4">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">The Foodie Experience</h3>
            {[
              { icon: <Users className="h-4 w-4" />, text: 'Matching you with expert local chefs' },
              { icon: <ShieldCheck className="h-4 w-4" />, text: 'Secure payments & escrow protection' },
              { icon: <Clock className="h-4 w-4" />, text: 'Prompt arrival & professional cleanup' },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex items-center gap-4 text-sm text-white/50">
                <span className="text-accent">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl h-fit">
          <h2 className="text-2xl font-bold mb-8">Booking Details</h2>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-sm text-red-400 flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleBookingFlow} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="date_time" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Event Date & Time</Label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-accent transition-colors" />
                <Input
                  id="date_time" type="datetime-local"
                  className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-accent focus:border-accent"
                  value={formData.date_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_time: e.target.value }))}
                  required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="guests_count" className="text-xs font-bold uppercase tracking-widest text-white/40">Number of Guests</Label>
                <span className="text-[10px] font-bold text-white/20">Ideal: {menu.guest_min}-{menu.guest_max}</span>
              </div>
              <div className="relative group">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-accent transition-colors" />
                <Input
                  id="guests_count" type="number"
                  min={1} max={menu.guest_max + 10}
                  className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-accent focus:border-accent"
                  value={formData.guests_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, guests_count: parseInt(e.target.value) || 0 }))}
                  required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-white/40">Event Location</Label>
                <button type="button" onClick={handleShareLocation} disabled={locating}
                  className="text-[10px] font-bold text-accent hover:opacity-80 flex items-center gap-1 transition-opacity disabled:opacity-30 uppercase tracking-widest">
                  {locating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                  Locate Me
                </button>
              </div>
              <div className="relative group">
                <MapPin className="absolute left-4 top-5 h-5 w-5 text-white/20 group-focus-within:text-accent transition-colors" />
                <Textarea
                  id="address"
                  className="pl-12 pt-4 bg-white/5 border-white/10 rounded-2xl focus:ring-accent focus:border-accent min-h-[100px]"
                  placeholder="Street name, floor, specific instructions..."
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_requests" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Special Requests</Label>
              <Textarea
                id="special_requests"
                className="bg-white/5 border-white/10 rounded-2xl focus:ring-accent focus:border-accent min-h-[80px]"
                placeholder="Allergies, kitchen setup info, etc."
                value={formData.special_requests}
                onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))} />
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/3 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Total Event Price</span>
                <span className="text-lg font-bold text-white">KES {calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">Prep Advance Due Now (25%)</span>
                <span className="text-xl font-black text-accent">KES {calculatePrepAdvance().toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-white/30 leading-snug">
                The remaining balance (60%) will be paid after successful event completion.
              </p>
            </div>

            <Button
              type="submit"
              disabled={bookingState === 'submitting' || !user}
              className="w-full h-16 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold text-lg shadow-glow transition-all">
              {bookingState === 'submitting'
                ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                : !user ? 'Sign In to Book' : 'Request & Pay Deposit'}
            </Button>
            
            <p className="text-[10px] text-center text-white/20 px-4">
              By clicking the button above, you agree to our terms of service and the chef selection SLA.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

