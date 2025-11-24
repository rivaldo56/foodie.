'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateClientProfile, uploadToCloudinary } from '@/lib/api';
import ProfileEditModal from '@/components/modals/ProfileEditModal';
import Image from 'next/image';
import { User as UserIcon, Mail, Phone, MapPin, CreditCard, Settings, LogOut, Edit } from 'lucide-react';

export default function ClientProfilePage() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
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

      formData.append('full_name', data.username);

      console.log('Sending update to backend...');
      const response = await updateClientProfile(formData);
      console.log('Backend response:', response);

      if (response.data) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Check console for details.');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-white/5 rounded-lg w-3/4" />
          <div className="h-10 bg-white/5 rounded-lg w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Profile</h1>
        <p className="text-white/70 text-lg">
          Manage your Foodie identity
        </p>
      </header>

      {/* Profile Info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden relative">
              {user?.profile_picture ? (
                <Image
                  src={user.profile_picture}
                  alt={user.full_name || 'User'}
                  fill
                  className="object-cover"
                />
              ) : (
                <UserIcon className="h-10 w-10 text-orange-500" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{user?.full_name || user?.username}</h2>
              <p className="text-white/60">{user?.role === 'client' ? 'Food Enthusiast' : 'User'}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <Edit className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 text-white/70">
            <Mail className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-white/50">Email</p>
              <p className="text-white">{user?.email}</p>
            </div>
          </div>
          {user?.phone_number && (
            <div className="flex items-center gap-3 text-white/70">
              <Phone className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-white/50">Phone</p>
                <p className="text-white">{user.phone_number}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dietary Preferences */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Dietary Preferences</h3>
        <p className="text-sm text-white/50">
          Set your dietary preferences to get personalized recommendations
        </p>
        <button className="mt-4 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition text-sm font-semibold">
          Manage Preferences
        </button>
      </div>

      {/* Saved Addresses */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">Saved Addresses</h3>
        </div>
        <p className="text-sm text-white/50">
          No saved addresses yet
        </p>
        <button className="mt-4 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition text-sm font-semibold">
          Add Address
        </button>
      </div>

      {/* Payment Methods */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
        </div>
        <p className="text-sm text-white/50">
          No payment methods saved
        </p>
        <button className="mt-4 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition text-sm font-semibold">
          Add Payment Method
        </button>
      </div>

      {/* Settings */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">Settings</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-white/70">Notifications</span>
            <button className="px-4 py-1 rounded-lg bg-white/10 text-white/70 text-sm">
              Manage
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-white/70">Privacy</span>
            <button className="px-4 py-1 rounded-lg bg-white/10 text-white/70 text-sm">
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-300 hover:bg-red-500/30 transition font-semibold"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>

      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentProfilePic={undefined}
        currentUsername={user?.full_name || user?.username || ''}
        currentBio=""
        onSave={handleProfileSave}
      />
    </div>
  );
}
