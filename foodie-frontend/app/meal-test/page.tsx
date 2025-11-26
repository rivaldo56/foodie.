'use client';

import { useState } from 'react';
import MealCard from '@/components/MealCard';
import MealDetailsView from '@/components/MealDetailsView';
import { Meal } from '@/lib/api';

// Mock data for testing
const MOCK_MEALS: Meal[] = [
    {
        id: 1,
        name: 'Truffle Mushroom Risotto',
        description: 'Creamy arborio rice with wild mushrooms, black truffle oil, and aged parmesan.',
        price: 2500,
        image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80',
        chef: 1,
        chef_name: 'Marco Pierre',
        rating: 4.8,
        category: 'Italian',

    },
    {
        id: 2,
        name: 'Pan-Seared Salmon',
        description: 'Fresh Atlantic salmon fillet with asparagus and lemon butter sauce.',
        price: 3200,
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&w=800&q=80',
        chef: 2,
        chef_name: 'Julia Child',
        rating: 4.9,
        category: 'Seafood',

    },
    {
        id: 3,
        name: 'Wagyu Beef Burger',
        description: 'Premium wagyu beef patty with caramelized onions, gruyere cheese, and brioche bun.',
        price: 1800,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        chef: 3,
        chef_name: 'Gordon Ramsay',
        rating: 4.7,
        category: 'American',
    },
    {
        id: 4,
        name: 'Sushi Platter',
        description: 'Assorted fresh nigiri and maki rolls with wasabi and pickled ginger.',
        price: 4500,
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
        chef: 4,
        chef_name: 'Jiro Ono',
        category: 'Japanese',
    }
];

export default function MealTestPage() {
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

    return (
        <div className="min-h-screen bg-black p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="space-y-4">
                    <h1 className="text-4xl font-bold text-white">Meal Details Interaction</h1>
                    <p className="text-muted text-lg max-w-2xl">
                        Tap any card below to trigger the premium meal details view.
                        This demonstrates the seamless transition and mobile-first design.
                    </p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {MOCK_MEALS.map((meal) => (
                        <div key={meal.id} className="h-[400px]">
                            <MealCard
                                meal={meal}
                                onClick={() => setSelectedMeal(meal)}
                                matchScore={95}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Meal Details Modal */}
            {selectedMeal && (
                <MealDetailsView
                    meal={selectedMeal}
                    isOpen={!!selectedMeal}
                    onClose={() => setSelectedMeal(null)}
                />
            )}
        </div>
    );
}
