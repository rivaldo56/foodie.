"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Recipe } from '@/types/recipe';
import { Clock, Flame, ChefHat, ArrowLeft, Users, PlayCircle, Plus } from 'lucide-react';
import Link from 'next/link';

interface RecipeDetailsProps {
    recipe: Recipe;
}

export default function RecipeDetails({ recipe }: RecipeDetailsProps) {
    const [activeTab, setActiveTab] = useState<'cook' | 'chef'>('cook');
    
    return (
        <div className="min-h-screen bg-background pb-24 relative">
            {/* Hero Image */}
            <div className="relative h-[50vh] w-full">
                <Image
                    src={recipe.image_url}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                
                <Link href="/" className="absolute top-6 left-6 p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition">
                    <ArrowLeft />
                </Link>
            </div>

            {/* Content Container */}
            <div className="relative -mt-20 px-6 max-w-4xl mx-auto space-y-8">
                {/* Title & Stats */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-accent text-sm font-medium tracking-wider uppercase">
                         {recipe.category?.icon} {recipe.category?.name || 'Recipe'}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                        {recipe.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6 text-muted-strong">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-accent" />
                            <span>{recipe.total_time_minutes || recipe.prep_time_minutes} min</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Flame size={18} className="text-red-400" />
                            <span className="capitalize">{recipe.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Users size={18} className="text-blue-400" />
                             <span>{recipe.servings} Servings</span>
                        </div>
                        {recipe.calories && (
                            <div className="px-3 py-1 rounded-full bg-surface-elevated text-xs border border-white/5">
                                {recipe.calories} kcal
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Switcher (The Soft Decision) */}
                <div className="p-1 rounded-2xl bg-surface-elevated/50 backdrop-blur-sm border border-white/5 flex gap-1">
                    <button
                        onClick={() => setActiveTab('cook')}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                            activeTab === 'cook' 
                            ? 'bg-gradient-to-r from-accent to-accent-strong text-black shadow-lg shadow-accent/20' 
                            : 'text-muted hover:text-white'
                        }`}
                    >
                        Cook It Yourself
                    </button>
                    <button
                        onClick={() => setActiveTab('chef')}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                            activeTab === 'chef' 
                            ? 'bg-white text-black shadow-lg' 
                            : 'text-muted hover:text-white'
                        }`}
                    >
                        <ChefHat size={18} />
                        Book a Chef
                    </button>
                </div>

                {/* View Content */}
                {activeTab === 'cook' ? (
                    <div className="grid md:grid-cols-[1fr_1.5fr] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Ingredients */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">Ingredients</h3>
                            <ul className="space-y-3">
                                {/* Need to fix type definition if ingredients missing in interface */}
                                {/* Assuming recipe.ingredients exists from serializer */}
                                {(recipe as any).ingredients?.map((ing: any, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-muted-strong">
                                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                                        <span>
                                            <span className="text-white font-medium">{ing.amount}</span> {ing.name}
                                            {ing.notes && <span className="text-xs text-muted block">{ing.notes}</span>}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                             <button className="w-full py-3 rounded-xl border border-dashed border-white/20 text-muted hover:text-white hover:border-white/40 transition flex items-center justify-center gap-2">
                                <Plus size={18} /> Add to Shopping List
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-8">
                             <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">Instructions</h3>
                             <div className="space-y-8">
                                {(recipe as any).instructions?.map((step: any, i: number) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center text-accent font-bold">
                                            {step.step_number}
                                        </div>
                                        <p className="text-lg text-muted-strong leading-relaxed">
                                            {step.instruction_text}
                                        </p>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface-elevated rounded-3xl p-8 border border-white/5 text-center space-y-6 animate-in zoom-in-95 duration-300">
                         <div className="h-20 w-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto text-accent">
                            <ChefHat size={40} />
                         </div>
                         <h3 className="text-2xl font-bold text-white">Want to relax tonight?</h3>
                         <p className="text-muted text-lg max-w-md mx-auto">
                            One of our verified chefs can shop, cook, and clean for you. Enjoy this <strong>{recipe.title}</strong> without lifting a finger.
                         </p>
                         
                         <div className="pt-4 grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                             <div className="bg-surface p-4 rounded-xl text-left border border-white/5">
                                <div className="text-accent font-bold mb-1">Personal Chef</div>
                                <div className="text-xs text-muted">Dedicated chef for the evening</div>
                             </div>
                              <div className="bg-surface p-4 rounded-xl text-left border border-white/5">
                                <div className="text-accent font-bold mb-1">We Shop</div>
                                <div className="text-xs text-muted">Fresh ingredients included</div>
                             </div>
                         </div>

                         <Link 
                            href={`/chefs?specialty=${recipe.category?.slug}`}
                            className="block w-full sm:w-auto mx-auto py-4 px-12 bg-white text-black font-bold text-lg rounded-full hover:bg-gray-200 transition transform hover:scale-105"
                         >
                            Find a Chef
                         </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
