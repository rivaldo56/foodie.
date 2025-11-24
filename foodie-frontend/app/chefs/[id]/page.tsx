'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getChefById, getMeals, Chef, Meal, mockChefs, mockMeals } from '@/lib/api';
import MealCard from '@/components/MealCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';

export default function ChefDetailPage() {
  const params = useParams();
  const chefId = parseInt(params.id as string);

  const [chef, setChef] = useState<Chef | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

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

      const mealsResponse = await getMeals();
      if (mealsResponse.data) {
        setMeals(mealsResponse.data.filter(m => m.chef === chefId));
      } else {
        setMeals(mockMeals.filter(m => m.chef === chefId));
      }

      setLoading(false);
    };

    fetchData();
  }, [chefId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Chef not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Chef Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="relative h-48 w-48 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {chef.profile_picture ? (
                  <Image
                    src={chef.profile_picture}
                    alt={chef.user?.full_name || 'Chef'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center text-4xl">
                    👨‍🍳
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {chef.user?.full_name || 'Chef'}
                {chef.is_verified && (
                  <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                )}
              </h1>
              <p className="text-xl text-gray-600 mb-4">{chef.specialties?.[0] || 'Signature Cuisine'}</p>

              <div className="flex items-center space-x-6 mb-6 justify-center md:justify-start">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500 text-2xl">⭐</span>
                  <span className="text-2xl font-bold text-gray-800">{(Number(chef.average_rating) || 0).toFixed(1)}</span>
                </div>

                {chef.experience_years && (
                  <p>
                    <span className="font-semibold">{chef.experience_years}</span> years of experience
                  </p>
                )}
              </div>

              <p className="text-gray-700 leading-relaxed">{chef.bio}</p>
            </div>
          </div>
        </div>

        {/* Chef's Meals */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Meals by this Chef</h2>

          {meals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No meals available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
