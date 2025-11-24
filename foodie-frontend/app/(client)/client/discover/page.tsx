'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getChefs, getMenuItems } from '@/lib/api';
import type { Chef, MenuItem } from '@/lib/api';
import ChefCard from '@/components/ChefCard';
import MenuItemCard from '@/components/MenuItemCard';
import CategoryButton from '@/components/CategoryButton';
import { Search, SlidersHorizontal, TrendingUp, Flame, ChefHat, Award, Wand2, Sparkles, Utensils } from 'lucide-react';

const CATEGORIES = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'hot', label: 'Hot', icon: Flame },
  { id: 'new', label: 'New Chef', icon: ChefHat },
  { id: 'special', label: 'Special', icon: Award },
  { id: 'magic', label: 'Taste of Magic', icon: Wand2 },
  { id: 'spicy', label: 'Hot & Spicy', icon: Sparkles },
];

const DISH_CATEGORIES = [
  { value: 'appetizer', label: 'Appetizers' },
  { value: 'main_course', label: 'Main Course' },
  { value: 'dessert', label: 'Desserts' },
  { value: 'beverage', label: 'Beverages' },
  { value: 'side_dish', label: 'Side Dishes' },
];

type TabType = 'chefs' | 'dishes';

export default function ClientDiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('dishes');

  // Chefs state
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [filteredChefs, setFilteredChefs] = useState<Chef[]>([]);

  // Menu items state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);

  // UI state
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedDishCategory, setSelectedDishCategory] = useState<string | null>(null);
  const [selectedChef, setSelectedChef] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (isAuthenticated) {
      loadData();
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (activeTab === 'chefs') {
      filterChefs();
    } else {
      filterMenuItems();
    }
  }, [activeTab, chefs, menuItems, searchQuery, activeCategory, selectedDishCategory, selectedChef, priceRange]);

  const loadData = async () => {
    try {
      setDataLoading(true);
      const [chefsResponse, menuItemsResponse] = await Promise.all([
        getChefs(),
        getMenuItems(),
      ]);

      if (chefsResponse.data) {
        const chefsData = Array.isArray(chefsResponse.data) ? chefsResponse.data : [];
        setChefs(chefsData);
      }

      if (menuItemsResponse.data) {
        // Handle paginated response
        let menuItemsData: MenuItem[] = [];
        if (Array.isArray(menuItemsResponse.data)) {
          menuItemsData = menuItemsResponse.data;
        } else if (menuItemsResponse.data && 'results' in menuItemsResponse.data) {
          menuItemsData = (menuItemsResponse.data as any).results;
        }
        console.log('📦 Menu Items Loaded:', menuItemsData.length, menuItemsData);
        setMenuItems(menuItemsData);
      }

      if (chefsResponse.error || menuItemsResponse.error) {
        setError(chefsResponse.error || menuItemsResponse.error || 'Failed to load data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const filterChefs = () => {
    if (!Array.isArray(chefs)) {
      setFilteredChefs([]);
      return;
    }

    let filtered = [...chefs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chef => {
        const name = (chef.user?.full_name || '').toLowerCase();
        const specialties = (chef.specialties || []).join(' ').toLowerCase();
        const city = (chef.city || '').toLowerCase();
        return name.includes(query) || specialties.includes(query) || city.includes(query);
      });
    }

    // Apply category filter
    if (activeCategory) {
      switch (activeCategory) {
        case 'trending':
          filtered = filtered.sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0));
          break;
        case 'hot':
          filtered = filtered.filter(chef => (chef.average_rating || 0) >= 4.5);
          break;
        case 'new':
          filtered = filtered.sort((a, b) => a.id - b.id).slice(0, 10);
          break;
        case 'special':
          filtered = filtered.filter(chef => chef.is_verified);
          break;
      }
    }

    setFilteredChefs(filtered);
  };

  const filterMenuItems = () => {
    if (!Array.isArray(menuItems)) {
      setFilteredMenuItems([]);
      return;
    }

    let filtered = [...menuItems];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const name = (item.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const chefName = (item.chef_name || '').toLowerCase();
        const ingredients = (item.ingredients || []).join(' ').toLowerCase();
        return name.includes(query) || description.includes(query) || chefName.includes(query) || ingredients.includes(query);
      });
    }

    // Apply dish category filter
    if (selectedDishCategory) {
      filtered = filtered.filter(item => item.category === selectedDishCategory);
    }

    // Apply chef filter
    if (selectedChef) {
      filtered = filtered.filter(item => item.chef === selectedChef);
    }

    // Apply price range filter
    filtered = filtered.filter(item =>
      item.price_per_serving >= priceRange[0] && item.price_per_serving <= priceRange[1]
    );

    setFilteredMenuItems(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'chefs') {
      filterChefs();
    } else {
      filterMenuItems();
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  const handleDishCategoryClick = (category: string) => {
    setSelectedDishCategory(selectedDishCategory === category ? null : category);
  };

  if (loading || dataLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-white/5 rounded-lg w-3/4" />
          <div className="h-10 bg-white/5 rounded-lg w-1/2" />
          <div className="h-12 bg-white/5 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Discover</h1>
        <p className="text-white/70 text-lg">
          Browse {activeTab === 'chefs' ? chefs.length : menuItems.length} amazing {activeTab === 'chefs' ? 'chefs' : 'dishes'}
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('dishes')}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'dishes'
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
            : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
        >
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            <span>Dishes</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('chefs')}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'chefs'
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
            : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
        >
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            <span>Chefs</span>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'chefs' ? 'chefs or cuisines' : 'dishes, chefs, or ingredients'}...`}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl bg-red-900/40 border border-red-500/50 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      {/* Dish Categories & Chef Filter (Dishes Tab) */}
      {activeTab === 'dishes' && (
        <div className="space-y-4">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-semibold text-white">Dish Categories</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {DISH_CATEGORIES.map(category => (
                <button
                  key={category.value}
                  onClick={() => handleDishCategoryClick(category.value)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${selectedDishCategory === category.value
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </section>

          {/* Chef Filter */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-white">Filter by Chef</h3>
            <select
              value={selectedChef || ''}
              onChange={(e) => setSelectedChef(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full md:w-64 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">All Chefs</option>
              {chefs.map(chef => (
                <option key={chef.id} value={chef.id} className="bg-gray-900">
                  {chef.user?.full_name}
                </option>
              ))}
            </select>
          </section>
        </div>
      )}

      {/* Chef Categories (Chefs Tab) */}
      {activeTab === 'chefs' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Explore by Category</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(category => (
              <CategoryButton
                key={category.id}
                icon={category.icon}
                label={category.label}
                isActive={activeCategory === category.id}
                onClick={() => handleCategoryClick(category.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Price Range Filter (Dishes Tab) */}
      {activeTab === 'dishes' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Price Range</h3>
            <span className="text-sm text-white/60">
              KES {priceRange[0]} - KES {priceRange[1]}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full accent-orange-500"
          />
        </section>
      )}

      {/* Results Count */}
      <div className="text-sm text-white/60">
        Showing {activeTab === 'chefs' ? filteredChefs.length : filteredMenuItems.length} of {activeTab === 'chefs' ? chefs.length : menuItems.length} results
      </div>

      {/* Grid */}
      {activeTab === 'chefs' ? (
        filteredChefs.length === 0 && !error ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-white/70 mb-2">No chefs found</p>
            <p className="text-sm text-white/50">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChefs.map(chef => (
              <ChefCard key={chef.id} chef={chef} />
            ))}
          </div>
        )
      ) : (
        filteredMenuItems.length === 0 && !error ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-white/70 mb-2">No dishes found</p>
            <p className="text-sm text-white/50">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map(item => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
