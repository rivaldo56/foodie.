'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Calendar, MapPin, Users, Navigation } from 'lucide-react';

type Meal = {
  id: string;
  name: string;
  description: string;
  price: number;
  kcal: number | null;
  image_url: string | null;
  category: string;
};

export default function MealBookingPage() {
  const params = useParams();
  const router = useRouter();
  const mealId = params.mealId as string;
  
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [user, setUser] = useState<any>(null);
  
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
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('id', mealId)
          .single();

        if (error) throw error;
        setMeal(data);
      } catch (err) {
        console.error('Error fetching meal data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (mealId) fetchData();
  }, [mealId]);

  const calculateTotal = () => {
    if (!meal) return 0;
    return (meal.price || 0) * formData.guests_count;
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data.display_name) {
            setFormData(prev => ({ ...prev, address: data.display_name }));
          } else {
            setFormData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setFormData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location");
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        alert("Please sign in to book.");
        router.push('/login?next=/book/meal/' + mealId);
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
                meal_id: mealId,
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

  if (!meal) {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white space-y-4">
          <h1 className="text-2xl font-bold">Meal Not Found</h1>
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
                <div className="relative h-80 w-full">
                    <Image
                        src={meal.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=800&q=80'}
                        alt={meal.name}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                     <div className="absolute bottom-6 left-6">
                         <span className="bg-accent/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm mb-2 inline-block">
                             {meal.category}
                         </span>
                         <h1 className="text-4xl font-bold">{meal.name}</h1>
                     </div>
                </div>
                <div className="p-8 space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Description</h3>
                        <p className="text-white/70 leading-relaxed italic">"{meal.description || 'No description available for this meal.'}"</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                         <div>
                            <p className="text-sm text-white/50">Price per Guest</p>
                            <p className="text-xl font-bold">KES {(meal.price || 0).toLocaleString()}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-sm text-white/50">Nutrition (Est.)</p>
                             <p className="text-white font-medium">{meal.kcal || 0} kcal</p>
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
                            className="pl-10 bg-white/5 border-white/10 text-white focus:border-accent min-h-[50px]"
                            value={formData.date_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, date_time: e.target.value }))}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                     <div className="flex justify-between">
                        <Label htmlFor="guests_count" className="text-white">Number of Guests</Label>
                     </div>
                    <div className="relative">
                        <Users className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                        <Input
                            id="guests_count"
                            type="number"
                            min={1}
                            max={100}
                            className="pl-10 bg-white/5 border-white/10 text-white focus:border-accent min-h-[50px]"
                            value={formData.guests_count}
                            onChange={(e) => setFormData(prev => ({ ...prev, guests_count: parseInt(e.target.value) }))}
                            required
                        />
                    </div>
                </div>

                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="address" className="text-white">Location Address</Label>
                        <button
                            type="button"
                            onClick={handleShareLocation}
                            disabled={locating}
                            className="text-xs text-accent hover:text-accent-strong flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                            {locating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Navigation className="h-3 w-3" />
                            )}
                            Share my location
                        </button>
                    </div>
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
