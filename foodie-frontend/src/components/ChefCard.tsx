'use client';

import Image from 'next/image';
import type { Chef } from '@/lib/api';
import { stableScore } from '@/lib/utils';
import { MapPin, Star, Heart } from 'lucide-react';
import { useState } from 'react';
import { toggleFavoriteChef } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ChefProfileModal from '@/components/modals/ChefProfileModal';
import BookingModal from '@/components/modals/BookingModal';
import { startConversation } from '@/lib/api/messages';

interface ChefCardProps {
  chef: Chef;
  matchScore?: number;
}

export default function ChefCard({ chef, matchScore }: ChefCardProps) {
  const router = useRouter();
  const displayName = chef.user?.full_name || `Chef #${chef.id}`;
  const match = matchScore ?? stableScore(`chef-${chef.id}`, 90, 97);
  const years = chef.experience_years ? `${chef.experience_years} yrs exp.` : 'Premium chef';
  const location = chef.city && chef.state ? `${chef.city}, ${chef.state}` : 'Nairobi, Kenya';

  const [isFavorited, setIsFavorited] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newState = !isFavorited;
    setIsFavorited(newState);

    try {
      const response = await toggleFavoriteChef(chef.id);
      if (response.error) {
        setIsFavorited(!newState);
        console.error('Failed to toggle favorite:', response.error);
      } else if (response.data) {
        setIsFavorited(response.data.is_favorited);
      }
    } catch (error) {
      setIsFavorited(!newState);
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCardClick = () => {
    setIsProfileModalOpen(true);
  };

  const handleBookNow = () => {
    setIsProfileModalOpen(false);
    setIsBookingModalOpen(true);
  };

  const handleMessage = async () => {
    try {
      setIsProfileModalOpen(false);
      // Assuming chef.user.id is the correct ID for the user to chat with
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

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group block w-full text-left cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleCardClick();
          }
        }}
      >
        <article className="gradient-border rounded-3xl overflow-hidden hover-glow transition-all duration-300">
          <div className="bg-surface-elevated rounded-[23px] overflow-hidden soft-border">
            <div className="relative h-56">
              {chef.profile_picture ? (
                <Image
                  src={chef.profile_picture}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              ) : (
                <div className="h-full w-full bg-surface flex items-center justify-center text-6xl">
                  <span role="img" aria-label="chef">
                    👨‍🍳
                  </span>
                </div>
              )}

              <div className="absolute top-4 left-4 badge-accent px-3 py-1 text-xs font-semibold rounded-full">
                ~ {match}% Match
              </div>

              <button
                onClick={handleToggleFavorite}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors z-10"
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${isFavorited ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <header className="space-y-1">
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  {displayName}
                </h3>
                <p className="text-sm text-muted">
                  {chef.specialties?.[0] || 'Signature cuisine expert'} · {years}
                </p>
              </header>

              <div className="flex items-center gap-3 text-sm text-muted-strong">
                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="h-4 w-4" fill="#fbbf24" />
                  {(Number(chef.average_rating) || 4.8).toFixed(1)}
                </span>
                <span className="h-1 w-1 rounded-full bg-muted/40" aria-hidden />
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-accent" />
                  {location}
                </span>
              </div>

              {chef.bio && (
                <p className="text-sm text-muted line-clamp-2">
                  {chef.bio}
                </p>
              )}
            </div>
          </div>
        </article>
      </div>

      <ChefProfileModal
        chef={chef}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onBook={handleBookNow}
        onMessage={handleMessage}
      />

      <BookingModal
        chef={chef}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
      />
    </>
  );
}


