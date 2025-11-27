'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMenuItems, updateProfile as updateChefProfile, uploadToCloudinary, type Chef, type MenuItem } from '@/services/chef.service';
import ChefBadge from '@/components/ChefBadge';
import MenuItemCard from '@/components/MenuItemCard';
import ProfileEditModal from '@/components/modals/ProfileEditModal';
import Image from 'next/image';
import { CheckCircle, Edit, Plus, Star, TrendingUp, Users, Utensils, User, Mail, Phone, MapPin, Camera, Save, Loader2, ChefHat, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ChefProfilePage() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [chefProfile, setChefProfile] = useState<Chef | null>(null);
  const [myDishes, setMyDishes] = useState<MenuItem[]>([]);
  const [dishesLoading, setDishesLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (user?.role === 'chef') {
      loadChefData();
    }
  }, [loading, isAuthenticated, user, router]);

  const loadChefData = async () => {
    try {
      setDishesLoading(true);

      // Fetch chef profile
      const { getMyProfile: getMyChefProfile } = await import('@/services/chef.service');
      const profileResponse = await getMyChefProfile();

      if (profileResponse.data) {
        setChefProfile(profileResponse.data);
      }

      // Fetch menu items and filter by current chef
      const response = await getMenuItems();

      if (response.data) {
        const allDishes = Array.isArray(response.data) ? response.data : [];

        // Filter dishes by chef ID if profile loaded
        if (profileResponse.data) {
          const filteredDishes = allDishes.filter(
            dish => {
              const dishChefId = typeof dish.chef === 'object' ? (dish.chef as any).id : dish.chef;
              return Number(dishChefId) === Number(profileResponse.data!.id);
            }
          );
          setMyDishes(filteredDishes);
        } else {
          setMyDishes(allDishes);
        }
      }
    } catch (err) {
      console.error('Failed to load chef data:', err);
    } finally {
      setDishesLoading(false);
    }
  };

  const handleProfileSave = async (data: { profilePic?: File; username: string; bio: string }) => {
    try {
      const formData = new FormData();

      if (data.profilePic) {
        console.log('Uploading image to Cloudinary...');
        // Try with profile_picture preset first, fallback to menu_items if it fails
        let imageUrl = await uploadToCloudinary(data.profilePic, 'profile_picture');
        if (!imageUrl) {
          console.log('Trying with menu_items preset as fallback...');
          imageUrl = await uploadToCloudinary(data.profilePic, 'menu_items');
        }
        console.log('Cloudinary URL:', imageUrl);

        if (imageUrl) {
          formData.append('profile_picture', imageUrl);
        } else {
          console.error('Failed to get Cloudinary URL');
          throw new Error('Failed to upload image to Cloudinary');
        }
      }

      formData.append('bio', data.bio);

      console.log('Sending update to backend...');
      const response = await updateChefProfile(formData);
      console.log('Backend response:', response);

      if (response.data) {
        setChefProfile(response.data);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Check console for details.');
      throw error;
    }
  };

  if (loading || dishesLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-white/5 rounded-3xl" />
        <div className="h-32 bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white/5 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Profile Header */}
      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        {/* Cover/Background */}
        <div className="h-32 bg-gradient-to-r from-orange-500/20 to-red-500/20 relative">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 transition backdrop-blur-sm"
          >
            <Edit className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 -mt-16 relative">
          {/* Profile Image with Badge */}
          <div className="relative w-32 h-32 mb-4">
            <div className="w-full h-full rounded-full border-4 border-white/10 bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-5xl overflow-hidden">
              {chefProfile?.profile_picture ? (
                <Image
                  src={chefProfile.profile_picture}
                  alt={chefProfile.user?.full_name || 'Chef'}
                  fill
                  className="object-cover"
                />
              ) : (
                <ChefHat className="h-12 w-12 text-muted" />
              )}
            </div>
            {/* Badge positioned on profile image */}
            <div className="absolute -bottom-2 -right-2">
              <ChefBadge badge={chefProfile?.badge || 'new'} size="sm" />
            </div>
          </div>

          {/* Name and Verification */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-white">{chefProfile?.user?.full_name || user?.full_name}</h1>
                {/* Verified Checkmark - only show if verified */}
                {chefProfile?.is_verified && (
                  <CheckCircle className="h-6 w-6 text-blue-500 fill-blue-500" />
                )}
              </div>
              <p className="text-white/60">@{user?.username}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/50 transition text-white/70 font-medium flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 transition text-white font-medium"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Bio */}
          {chefProfile?.bio && (
            <p className="text-white/70 mb-6 max-w-2xl">
              {chefProfile.bio}
            </p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Utensils className="h-5 w-5 text-orange-500" />
                <p className="text-2xl font-bold text-white">{myDishes.length}</p>
              </div>
              <p className="text-sm text-white/60">Dishes Posted</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="h-5 w-5 text-yellow-500" />
                <p className="text-2xl font-bold text-white">{chefProfile?.average_rating ? parseFloat(chefProfile.average_rating.toString()).toFixed(1) : '0.0'}</p>
              </div>
              <p className="text-sm text-white/60">Avg Rating</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-5 w-5 text-green-500" />
                <p className="text-2xl font-bold text-white">{chefProfile?.total_bookings || 0}</p>
              </div>
              <p className="text-sm text-white/60">Total Bookings</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <p className="text-2xl font-bold text-white">{chefProfile?.total_reviews || 0}</p>
              </div>
              <p className="text-sm text-white/60">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Dishes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">My Dishes</h2>
          <Link
            href="/chef/create"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 transition text-white font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Dish</span>
          </Link>
        </div>

        {myDishes.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <Utensils className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/70 mb-2">No dishes posted yet</p>
            <p className="text-sm text-white/50 mb-4">
              Start showcasing your culinary creations to attract customers
            </p>
            <Link
              href="/chef/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 transition text-white font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Dish</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myDishes.map((dish) => (
              <div key={dish.id} className="relative group">
                <MenuItemCard item={dish} />
                {/* Edit/Delete Actions Overlay */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-full bg-blue-500/90 hover:bg-blue-600 transition backdrop-blur-sm">
                    <Edit className="h-4 w-4 text-white" />
                  </button>
                  <button className="p-2 rounded-full bg-red-500/90 hover:bg-red-600 transition backdrop-blur-sm">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentProfilePic={chefProfile?.profile_picture || undefined}
        currentUsername={chefProfile?.user?.full_name || ''}
        currentBio={chefProfile?.bio || ''}
        onSave={handleProfileSave}
      />
    </div>
  );
}
