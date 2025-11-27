'use client';

import { MapPin, Star, Calendar, MessageCircle, Utensils, Award, ArrowLeft, ChefHat, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getChefById, getReviews as getChefReviews, Chef, ChefReview } from '@/services/chef.service';
import { getChefMeals, Meal } from '@/services/booking.service';
import { mockChefs, mockMeals } from '@/lib/api';
import { startConversation } from '@/lib/api/messages';
import MealCard from '@/components/MealCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingModal from '@/components/modals/BookingModal';
import Image from 'next/image';

import BackButton from '@/components/BackButton';

export default function ChefDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chefId = parseInt(params.id as string);

  const [chef, setChef] = useState<Chef | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [reviews, setReviews] = useState<ChefReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'meals' | 'reviews'>('meals');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const chefResponse = await getChefById(chefId);
      if (chefResponse.data) {
        setChef(chefResponse.data);
      } else {
        const mockChef = mockChefs.find(c => c.id === chefId);
        if (mockChef) setChef(mockChef);
      }

      const mealsResponse = await getChefMeals(chefId);
      if (mealsResponse.data) {
        setMeals(mealsResponse.data);
      } else {
        setMeals(mockMeals.filter(m => m.chef === chefId));
      }

      const reviewsResponse = await getChefReviews(chefId);
      if (reviewsResponse.data) {
        setReviews(reviewsResponse.data);
      }

      setLoading(false);
    };

    fetchData();
  }, [chefId]);

  const handleBookNow = () => {
    setIsBookingModalOpen(true);
  };

  const handleMessage = async () => {
    if (!chef?.user?.id) return;

    try {
      const response = await startConversation(chef.user.id);
      if (response.data) {
        router.push(`/client/messages?conversationId=${response.data.id}`);
      } else {
        console.error('Failed to start conversation:', response.error);
        alert(`Failed to start chat: ${response.error}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('An unexpected error occurred while starting the chat.');
    }
  };

  const handleBookingSuccess = () => {
    setIsBookingModalOpen(false);
    router.push('/client/bookings');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f1012]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="min-h-screen bg-[#0f1012] flex items-center justify-center">
        <div className="text-center space-y-4">
          <ChefHat className="h-16 w-16 text-white/20 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Chef not found</h1>
          <button
            onClick={() => router.back()}
            className="text-white/60 hover:text-white font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const displayName = chef.user?.full_name || 'Chef';
  const location = chef.city && chef.state ? `${chef.city}, ${chef.state}` : 'Nairobi, Kenya';
  const rating = Number(chef.average_rating) || 0;
  const reviewCount = chef.total_reviews || 0;
  const experience = chef.experience_years || 1;

  return (
    <>
      <div className="min-h-screen bg-[#0f1012] text-white pb-20">
        {/* Back Button - Desktop */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <BackButton label="Back" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12 mb-12">

            {/* Profile Picture (Left Column) */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className={`relative h-32 w-32 md:h-40 md:w-40 rounded-full p-[3px] ${chef.badge === 'new' ? 'bg-green-500' : 'bg-[#1f2228]'}`}>
                <div className="h-full w-full rounded-full border-2 border-[#0f1012] overflow-hidden relative bg-[#16181d]">
                  {chef.profile_picture ? (
                    <Image
                      src={chef.profile_picture}
                      alt={displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/20">
                      <ChefHat className="h-16 w-16" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Section (Right Column) */}
            <div className="flex-1 w-full md:w-auto space-y-6">

              {/* 1. Name & Location */}
              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl md:text-3xl font-normal text-white">{displayName}</h1>
                  {chef.is_verified && (
                    <Award className="h-6 w-6 text-blue-500 fill-blue-500/10" />
                  )}
                </div>
                <div className="text-gray-400 text-sm font-medium flex items-center justify-center md:justify-start gap-1">
                  <MapPin className="h-3 w-3 text-orange-500" /> {location}
                </div>
              </div>

              {/* 2. Bio */}
              <div className="text-center md:text-left space-y-1">
                <div className="text-white/90 whitespace-pre-wrap text-base">{chef.bio || "Professional Chef on Foodie"}</div>
              </div>

              {/* 3. Stats */}
              <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12 text-base border-t border-b border-white/10 md:border-none py-4 md:py-0">
                <div className="text-center md:text-left">
                  <span className="font-bold block md:inline text-lg">{rating.toFixed(1)}</span> <span className="text-white/70">rating</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-bold block md:inline text-lg">{reviewCount}</span> <span className="text-white/70">reviews</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-bold block md:inline text-lg">{experience}+</span> <span className="text-white/70">years exp</span>
                </div>
              </div>

              {/* 4. Buttons */}
              <div className="flex gap-3 w-full md:max-w-md mx-auto md:mx-0">
                <button
                  onClick={handleBookNow}
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Book Chef
                </button>
                <button
                  onClick={handleMessage}
                  className="flex-1 py-2 bg-[#1f2228] hover:bg-[#2a2d35] text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </button>
              </div>

            </div>
          </div>

          {/* Content Tabs */}
          <div className="border-t border-white/10 mb-6">
            <div className="flex justify-center gap-12">
              <button
                onClick={() => setActiveTab('meals')}
                className={`flex items-center gap-2 py-4 border-t-2 text-xs md:text-sm font-medium tracking-widest transition-colors ${activeTab === 'meals'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/40 hover:text-white/70'
                  }`}
              >
                MEALS
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 py-4 border-t-2 text-xs md:text-sm font-medium tracking-widest transition-colors ${activeTab === 'reviews'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/40 hover:text-white/70'
                  }`}
              >
                <Star className="h-3 w-3 md:h-4 md:w-4" />
                REVIEWS
              </button>
            </div>
          </div>

          {/* Content Grid */}
          {activeTab === 'meals' ? (
            meals.length === 0 ? (
              <div className="py-20 text-center">
                <div className="h-16 w-16 rounded-full border-2 border-white/20 flex items-center justify-center mx-auto mb-4">
                  <Utensils className="h-8 w-8 text-white/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Meals Yet</h3>
                <p className="text-white/60">When {displayName} posts meals, they'll appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </div>
            )
          ) : (
            reviews.length === 0 ? (
              <div className="py-20 text-center">
                <div className="h-16 w-16 rounded-full border-2 border-white/20 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Reviews Yet</h3>
                <p className="text-white/60">Be the first to review {displayName}!</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-surface-elevated p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                          {review.client_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{review.client_name}</h4>
                          <p className="text-xs text-white/40">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-white">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-white/80 leading-relaxed">{review.comment}</p>
                    {(review.food_quality || review.professionalism || review.punctuality) && (
                      <div className="mt-4 pt-4 border-t border-white/5 flex gap-6 text-xs text-white/60">
                        {review.food_quality && (
                          <div className="flex items-center gap-1">
                            <Utensils className="h-3 w-3" />
                            <span>Food: {review.food_quality}</span>
                          </div>
                        )}
                        {review.professionalism && (
                          <div className="flex items-center gap-1">
                            <ChefHat className="h-3 w-3" />
                            <span>Pro: {review.professionalism}</span>
                          </div>
                        )}
                        {review.punctuality && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Time: {review.punctuality}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <BookingModal
        chef={chef}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
      />
    </>
  );
}
