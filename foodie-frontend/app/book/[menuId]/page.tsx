'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';

type Menu = {
  id: string;
  name: string;
  description: string;
  price_per_person: number;
  guest_min: number;
  guest_max: number;
  image_url: string | null;
  experience: {
    name: string;
    image_url: string | null;
  };
};

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = params.menuId as string;
  
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
      } else {
        setMenu(data as any);
        if (data) {
             setFormData(prev => ({ ...prev, guests_count: data.guest_min || 2 }));
        }
      }
      setLoading(false);
    }

    if (menuId) fetchData();
  }, [menuId]);

  const calculateTotal = () => {
    if (!menu) return 0;
    return menu.price_per_person * formData.guests_count;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        alert("Please sign in to book.");
        router.push('/login?next=/book/' + menuId);
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
                menu_id: menuId,
                date_time: new Date(formData.date_time).toISOString(),
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
        router.push(bookingId ? `/bookings/confirmation?booking_id=${bookingId}` : '/bookings');
    } catch (error: any) {
        console.error("Booking failed:", error);
        alert("Booking failed: " + error.message);
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
             <Link href="/">Back to Home</Link>
          </Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white pb-20 pt-24 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
            <Link href="/" className="inline-flex items-center text-white/60 hover:text-white transition-colors mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel Booking
            </Link>
            
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                <div className="relative h-64 w-full">
                    <Image
                        src={menu.image_url || menu.experience.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=800&q=80'}
                        alt={menu.name}
                        fill
                        className="object-cover"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                     <div className="absolute bottom-6 left-6">
                         <p className="text-white/80 text-sm mb-1">{menu.experience.name}</p>
                         <h1 className="text-3xl font-bold">{menu.name}</h1>
                     </div>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Menu Description</h3>
                        <p className="text-white/70 leading-relaxed">{menu.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                         <div>
                            <p className="text-sm text-white/50">Price per Guest</p>
                            <p className="text-xl font-bold">KES {menu.price_per_person.toLocaleString()}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-sm text-white/50">Details</p>
                             <p className="text-white font-medium">{menu.guest_min}-{menu.guest_max} Guests</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm h-fit">
            <h2 className="text-2xl font-bold mb-6">Confirm Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                    <Label htmlFor="date_time" className="text-white">Date & Time</Label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                        <Input
                            id="date_time"
                            type="datetime-local"
                            className="pl-10 bg-white/5 border-white/10 text-white focus:border-accent min-h-[50px] date-input-white"
                            value={formData.date_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, date_time: e.target.value }))}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                     <div className="flex justify-between">
                        <Label htmlFor="guests_count" className="text-white">Number of Guests</Label>
                        <span className="text-xs text-white/50">Min: {menu.guest_min}, Max: {menu.guest_max}</span>
                     </div>
                    <div className="relative">
                        <Users className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                        <Input
                            id="guests_count"
                            type="number"
                            min={menu.guest_min}
                            max={menu.guest_max}
                            className="pl-10 bg-white/5 border-white/10 text-white focus:border-accent min-h-[50px]"
                            value={formData.guests_count}
                            onChange={(e) => setFormData(prev => ({ ...prev, guests_count: parseInt(e.target.value) }))}
                            required
                        />
                    </div>
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="address" className="text-white">Location Address</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                        <Textarea
                            id="address"
                            className="pl-10 bg-white/5 border-white/10 text-white focus:border-accent min-h-[80px]"
                            placeholder="Enter full address for the chef..."
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            required
                        />
                    </div>
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="special_requests" className="text-white">Special Requests (Optional)</Label>
                    <Textarea
                        id="special_requests"
                        className="bg-white/5 border-white/10 text-white focus:border-accent"
                        placeholder="Allergies, dietary restrictions, gate codes..."
                        value={formData.special_requests}
                        onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
                    />
                </div>

                <div className="pt-6 border-t border-white/10 mt-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-medium">Total Price</span>
                        <span className="text-3xl font-bold text-accent">KES {calculateTotal().toLocaleString()}</span>
                    </div>
                    
                    <Button 
                        type="submit" 
                        disabled={submitting || !user} 
                        className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent-strong text-white rounded-xl shadow-glow"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                            </>
                        ) : !user ? (
                            "Sign In to Book"
                        ) : (
                            "Request Booking"
                        )}
                    </Button>
                    {!user && (
                         <p className="text-center text-xs text-white/40 mt-2">You will be redirected to login.</p>
                    )}
                </div>
            </form>
        </div>

      </div>
    </div>
  );
}
