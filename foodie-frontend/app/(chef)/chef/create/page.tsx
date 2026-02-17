'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { uploadImage } from '@/lib/storage';
import {
  Upload,
  X,
  Plus,
  Minus,
  DollarSign,
  Package,
  Truck,
  Store,
  Image as ImageIcon,
  Video
} from 'lucide-react';

interface DishFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  delivery: boolean;
  pickup: boolean;
  meal_prep: boolean;
}

const CATEGORIES = [
  { value: 'appetizer', label: 'Appetizers' },
  { value: 'main_course', label: 'Main Course' },
  { value: 'dessert', label: 'Desserts' },
  { value: 'beverage', label: 'Beverages' },
  { value: 'side_dish', label: 'Side Dishes' },
];

export default function ChefCreatePage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();
  const [formData, setFormData] = useState<DishFormData>({
    name: '',
    description: '',
    category: CATEGORIES[0].value,
    price: '',
    delivery: true,
    pickup: true,
    meal_prep: false,
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof DishFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter a dish name');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    if (!formData.delivery && !formData.pickup && !formData.meal_prep) {
      setError('Please select at least one fulfillment option');
      return;
    }

    setIsSubmitting(true);

    try {
      const { createMenuItem } = await import('@/services/chef.service');
      
      let imageUrl = '';
      if (mediaFiles.length > 0) {
          const uploadedUrl = await uploadImage(mediaFiles[0], 'menus'); // Upload to 'menus' bucket
          if (uploadedUrl) {
              imageUrl = uploadedUrl;
          } else {
             console.error('Failed to upload image');
             // Optionally handle error or proceed without image
          }
      }

      const response = await createMenuItem({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price_per_serving: parseFloat(formData.price),
        image: imageUrl, // Pass URL string
      });

      if (response.error) {
        setError(response.error);
        return;
      }

      // Success - redirect to success page
      router.push(`/chef/create/success?id=${response.data?.id}`);
    } catch (err) {
      console.error('[Create Post Error]:', err);
      setError(err instanceof Error ? err.message : 'Failed to post dish');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0f0f] via-[#1b1814] to-[#0f0c0a] text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-white/70">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace('/auth');
    return null;
  }

  if (user?.role !== 'chef') {
    router.replace('/client/home');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f0f] via-[#1b1814] to-[#0f0c0a] text-white p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Create New Dish</h1>
          <p className="text-white/70">Share your culinary creation with the world</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dish Details */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Dish Details
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Dish Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Grilled Salmon with Lemon Butter"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/40 backdrop-blur transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your dish, its flavors, and what makes it special..."
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/40 backdrop-blur transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 px-4 text-white backdrop-blur transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-gray-900">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Media Upload */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-orange-500" />
              Photos & Videos
            </h2>

            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-orange-500/50 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-white/40 mb-2" />
                  <p className="text-sm text-white/60">
                    Click to upload photos or videos
                  </p>
                  <p className="text-xs text-white/40">PNG, JPG, MP4 up to 10MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaChange}
                />
              </label>

              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-white/5">
                        {mediaFiles[index]?.type.startsWith('video/') ? (
                          <video src={preview} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 hover:bg-red-500 transition opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              Pricing
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Price (KES) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
                  KES
                </span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-16 pr-4 text-white placeholder-white/40 backdrop-blur transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Options */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              Fulfillment Options
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 cursor-pointer hover:border-orange-500/50 transition">
                <input
                  type="checkbox"
                  checked={formData.delivery}
                  onChange={(e) => handleInputChange('delivery', e.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Delivery Available</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Customers can order for delivery
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 cursor-pointer hover:border-orange-500/50 transition">
                <input
                  type="checkbox"
                  checked={formData.pickup}
                  onChange={(e) => handleInputChange('pickup', e.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Pickup Available</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Customers can pick up their order
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 cursor-pointer hover:border-orange-500/50 transition">
                <input
                  type="checkbox"
                  checked={formData.meal_prep}
                  onChange={(e) => handleInputChange('meal_prep', e.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Meal Prep Available</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Offer as meal prep/batch cooking service
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 py-4 px-6 font-semibold text-white transition shadow-lg shadow-orange-500/20"
          >
            {isSubmitting ? 'Posting...' : 'Post Dish'}
          </button>
        </form>
      </div>
    </div>
  );
}
