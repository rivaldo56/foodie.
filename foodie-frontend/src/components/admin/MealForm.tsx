'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/contexts/ToastContext';
import { mealService, Meal } from '@/services/meal.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

interface MealFormProps {
  mealId?: string;
}

export function MealForm({ mealId }: MealFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!mealId);
  const [formData, setFormData] = useState<Omit<Meal, 'id' | 'created_at' | 'total_bookings' | 'average_rating'>>({
    name: '',
    description: '',
    category: 'main',
    image_url: '',
    kcal: null,
    cuisine_type: '',
    dietary_tags: [],
    price: null,
    is_active: true,
  });

  const categories = [
    { value: 'starter', label: 'Starter' },
    { value: 'main', label: 'Main' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'side', label: 'Side' },
    { value: 'drink', label: 'Drink' },
  ];

  useEffect(() => {
    if (mealId) {
      const fetchMeal = async () => {
        try {
          const { data, error } = await mealService.getMealById(mealId);
          if (error) throw error;
          if (data) {
            setFormData({
              name: data.name,
              description: data.description || '',
              category: data.category as any,
              image_url: data.image_url || '',
              kcal: data.kcal,
              cuisine_type: data.cuisine_type || '',
              dietary_tags: data.dietary_tags || [],
              price: data.price ? Number(data.price) : null,
              is_active: data.is_active,
            });
          }
        } catch (err: any) {
          showToast(err.message || 'Failed to fetch meal', 'error');
        } finally {
          setFetching(false);
        }
      };
      fetchMeal();
    }
  }, [mealId, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'kcal' || name === 'price' ? (value ? Number(value) : null) : value 
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value as any }));
  };

  const handleDietaryTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, dietary_tags: tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let result;
      if (mealId) {
        result = await mealService.updateMeal(mealId, formData);
      } else {
        result = await mealService.createMeal(formData);
      }

      if (result.error) throw result.error;

      showToast(`Meal ${mealId ? 'updated' : 'created'} successfully`, 'success');
      router.push('/admin/meals');
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to save meal', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-[#ff7642]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-orange-600">
          <Link href="/admin/meals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Meals
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-white">{mealId ? 'Edit Meal' : 'Create Meal'}</h1>
        <p className="text-[#cbd5f5]">Define an atomic dish for your menus.</p>
      </div>

      <Card className="bg-[#16181d] border-white/5 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-[#f9fafb]">Meal Details</CardTitle>
            <CardDescription className="text-[#cbd5f5]">
              Basic information about the dish.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#f9fafb] font-medium">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Pan-Seared Red Snapper"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="category" className="text-[#f9fafb] font-medium">Category</Label>
                <Select onValueChange={handleCategoryChange} value={formData.category}>
                    <SelectTrigger className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                    <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                    {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>

                <div className="space-y-2">
                <Label htmlFor="cuisine_type" className="text-[#f9fafb] font-medium">Cuisine Type</Label>
                <Input
                    id="cuisine_type"
                    name="cuisine_type"
                    placeholder="e.g. Swahili, French"
                    value={formData.cuisine_type || ''}
                    onChange={handleChange}
                    className="bg-[#1f2228] border-white/10 text-[#f9fafb]"
                />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#f9fafb] font-medium">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Briefly describe the dish..."
                rows={3}
                value={formData.description || ''}
                onChange={handleChange}
                className="bg-[#1f2228] border-white/10 text-[#f9fafb]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="kcal" className="text-[#f9fafb] font-medium">Calories (kcal)</Label>
                <Input
                    id="kcal"
                    name="kcal"
                    type="number"
                    placeholder="e.g. 450"
                    value={formData.kcal || ''}
                    onChange={handleChange}
                    className="bg-[#1f2228] border-white/10 text-[#f9fafb]"
                />
                </div>

                <div className="space-y-2">
                <Label htmlFor="price" className="text-[#f9fafb] font-medium">Base Price (optional)</Label>
                <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="e.g. 1500"
                    value={formData.price || ''}
                    onChange={handleChange}
                    className="bg-[#1f2228] border-white/10 text-[#f9fafb]"
                />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietary_tags" className="text-[#f9fafb] font-medium">Dietary Tags (comma separated)</Label>
              <Input
                id="dietary_tags"
                name="dietary_tags"
                placeholder="e.g. Vegan, Gluten-Free"
                value={formData.dietary_tags.join(', ')}
                onChange={handleDietaryTagsChange}
                className="bg-[#1f2228] border-white/10 text-[#f9fafb]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#f9fafb] font-medium">Meal Image</Label>
              <div className="p-1 rounded-xl bg-[#1f2228]/50 border border-dashed border-white/10">
                  <ImageUpload
                    value={formData.image_url || ''}
                    onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                    bucket="meals"
                    label="Upload Meal Image"
                    onUploadError={(msg) => showToast(msg, 'error')}
                  />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#1f2228] border border-white/5">
                <Label htmlFor="is_active" className="text-[#f9fafb] font-medium cursor-pointer">Active and visible to public</Label>
                <Switch 
                   id="is_active" 
                   checked={formData.is_active} 
                   onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                 />
            </div>

          </CardContent>
          <CardFooter className="flex justify-between border-t border-white/5 p-6 bg-[#16181d]/50">
            <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.back()}
                className="border-white/10 text-[#cbd5f5] hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-[#ff7642] hover:bg-[#ff8b5f] text-white px-8"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mealId ? 'Update Meal' : 'Create Meal'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
