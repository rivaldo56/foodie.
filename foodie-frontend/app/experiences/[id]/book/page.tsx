'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Calendar, MapPin, Users, Info } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

type Menu = {
  id: string;
  name: string;
  description: string;
  base_price: number;
  price_per_person: number;
  guest_min: number;
  guest_max: number;
  image_url: string | null;
  experience: {
    name: string;
    image_url: string | null;
  };
};

function BookingFormInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const experienceId = params.id as string;
  const menuId = searchParams.get('menuId');
  const { showToast } = useToast();
  
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    date_time: '',
    address: '',
    guests_count: 2,
    special_requests: '',
  });

  useEffect(() => {
    async function fetchData() {
       const { data: { user } } = await supabase.auth.getUser();
       setUser(user);

      if (!menuId) {
          showToast('No menu selected', 'error');
          router.push(`/experiences/${experienceId}`);
          return;
      }

      const { data, error } = await supabase
        .from('menus')
        .select(`
            *,
            experience:experiences (
                name,
                image_url
            )
        `)
        .eq('id', menuId)
        .single();

      if (error) {
        console.error('Error fetching menu:', error);
        showToast('Failed to load menu details', 'error');
      } else {
        setMenu(data as any);
        if (data) {
             setFormData(prev => ({ ...prev, guests_count: data.guest_min || 2 }));
        }
      }
      setLoading(false);
    }

    fetchData();
  }, [menuId, experienceId, router, showToast]);

  const calculateTotal = () => {
    if (!menu) return 0;
    const base = Number(menu.base_price || 0);
    const perPerson = Number(menu.price_per_person || 0);
    return base + (perPerson * formData.guests_count);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        showToast("Please sign in to book.", "info");
        router.push(`/login?next=/experiences/${experienceId}/book?menuId=${menuId}`);
        return;
    }
    
    // Simple future date validation
    const selectedDate = new Date(formData.date_time);
    const now = new Date();
    if (selectedDate <= now) {
        showToast("Please select a future date and time", "error");
        return;
    }

    setSubmitting(true);

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                experience_id: experienceId,
                menu_id: menuId,
                date_time: selectedDate.toISOString(),
                address: formData.address,
                guests_count: formData.guests_count,
                special_requests: formData.special_requests
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to create booking');
        }

        const bookingId = result.booking?.id;
        showToast("Booking request sent!", "success");
        router.push(bookingId ? `/bookings/${bookingId}/confirmation` : '/client/bookings');
    } catch (error: any) {
        console.error("Booking failed:", error);
        showToast(error.message, "error");
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center bg-[#0f0c0a] text-white">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
      );
  }

  if (!menu) {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white space-y-4">
          <h1 className="text-2xl font-bold">Menu Not Found</h1>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
             <Link href={`/experiences/${experienceId}`}>Back to Experience</Link>
          </Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white pb-20 pt-24 px-4 overflow-x-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8 animate-in slide-in-from-left-5 duration-500">
            <Link href={`/experiences/${experienceId}`} className="inline-flex items-center text-white/60 hover:text-white transition-colors mb-4 group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Cancel Booking
            </Link>
            
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                <div className="relative h-64 w-full">
                    <Image
                        src={menu.image_url || menu.experience.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=800&q=80'}
                        alt={menu.name}
                        fill
                        className="object-cover"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                     <div className="absolute bottom-6 left-6">
                         <p className="text-white/80 text-sm mb-1 uppercase tracking-widest font-semibold">{menu.experience.name}</p>
                         <h1 className="text-3xl font-bold">{menu.name}</h1>
                     </div>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                           <UtensilsIcon className="h-4 w-4 text-accent" /> Menu Description
                        </h3>
                        <p className="text-white/70 leading-relaxed text-sm">{menu.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Base Price</p>
                            <p className="text-lg font-bold">KES {menu.base_price.toLocaleString()}</p>
                         </div>
                         <div className="space-y-1">
                             <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Per Guest</p>
                             <p className="text-lg font-bold">KES {menu.price_per_person.toLocaleString()}</p>
                         </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-2xl p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <p className="text-xs text-white/60">
                            The total price is calculated as: <strong>Base Price + (Price per Guest × Number of Guests)</strong>. This ensures we cover the chef&apos;s travel and preparation costs.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl h-fit animate-in slide-in-from-right-5 duration-500">
            <h2 className="text-2xl font-bold mb-6">Confirm Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                    <Label htmlFor="date_time" className="text-sm font-medium text-white/80">Date & Time</Label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-white/40" />
                        <Input
                            id="date_time"
                            type="datetime-local"
                            className="pl-10 h-12 bg-white/5 border-white/10 text-white focus:border-accent focus:ring-accent/20 transition-all rounded-xl"
                            value={formData.date_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, date_time: e.target.value }))}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <Label htmlFor="guests_count" className="text-sm font-medium text-white/80">Number of Guests</Label>
                        <span className="text-[10px] uppercase font-bold text-accent px-2 py-0.5 bg-accent/10 rounded">Min: {menu.guest_min}, Max: {menu.guest_max}</span>
                     </div>
                    <div className="relative">
                        <Users className="absolute left-3 top-3.5 h-5 w-5 text-white/40" />
                        <Input
                            id="guests_count"
                            type="number"
                            min={menu.guest_min}
                            max={menu.guest_max}
                            className="pl-10 h-12 bg-white/5 border-white/10 text-white focus:border-accent focus:ring-accent/20 transition-all rounded-xl"
                            value={formData.guests_count}
                            onChange={(e) => setFormData(prev => ({ ...prev, guests_count: parseInt(e.target.value) || 0 }))}
                            required
                        />
                    </div>
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-white/80">Event Location Address</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                        <Textarea
                            id="address"
                            className="pl-10 bg-white/5 border-white/10 text-white focus:border-accent focus:ring-accent/20 transition-all rounded-xl min-h-[100px] resize-none"
                            placeholder="Enter full address for the chef..."
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            required
                        />
                    </div>
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="special_requests" className="text-sm font-medium text-white/80">Special Requests <span className="text-white/40">(Optional)</span></Label>
                    <Textarea
                        id="special_requests"
                        className="bg-white/5 border-white/10 text-white focus:border-accent focus:ring-accent/20 transition-all rounded-xl min-h-[80px] resize-none"
                        placeholder="Allergies, dietary restrictions, gate codes..."
                        value={formData.special_requests}
                        onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
                    />
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 bg-white/[0.02] -mx-8 px-8 rounded-b-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <span className="text-sm text-white/40 uppercase tracking-widest font-bold">Estimated Total</span>
                            <p className="text-xs text-white/30">Inc. base fee & guest count</p>
                        </div>
                        <span className="text-3xl font-bold text-accent">KES {calculateTotal().toLocaleString()}</span>
                    </div>
                    
                    <Button 
                        type="submit" 
                        disabled={submitting || !user} 
                        className="w-full h-14 text-lg font-bold bg-accent hover:bg-orange-500 text-white rounded-xl shadow-xl shadow-accent/20 transition-all active:scale-[0.98]"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                            </>
                        ) : !user ? (
                            "Sign In to Book"
                        ) : (
                            "Send Booking Request"
                        )}
                    </Button>
                    {!user && (
                         <p className="text-center text-xs text-white/40 mt-3">You will be redirected to secure login.</p>
                    )}
                </div>
            </form>
        </div>

      </div>
    </div>
  );
}

function UtensilsIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
    )
}

export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-[#0f0c0a] text-white">
                <Loader2 className="h-10 w-10 animate-spin text-accent" />
            </div>
        }>
            <BookingFormInner />
        </Suspense>
    );
}
