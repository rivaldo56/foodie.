'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useMenusAdmin } from '@/hooks/useMenusAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/contexts/ToastContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mealService, Meal } from '@/services/meal.service';

export default function CreateMenuPage() {
  const router = useRouter();
  const params = useParams();
  const experienceId = params.id as string;
  const { showToast } = useToast();
  const { createMenu, experience } = useMenusAdmin(experienceId);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '0',
    price_per_person: '',
    guest_min: 2,
    guest_max: 20,
    image_url: '',
    dietary_tags: '',
  });

  const [availableMeals, setAvailableMeals] = useState<{
    starters: Meal[];
    mains: Meal[];
    desserts: Meal[];
  }>({ starters: [], mains: [], desserts: [] });

  const [selectedMeals, setSelectedMeals] = useState<{
    starter_id: string;
    main_id: string;
    dessert_id: string;
  }>({ starter_id: '', main_id: '', dessert_id: '' });

  useEffect(() => {
    const loadMeals = async () => {
      try {
        const [starters, mains, desserts] = await Promise.all([
          mealService.getMealsByCategory('starter'),
          mealService.getMealsByCategory('main'),
          mealService.getMealsByCategory('dessert'),
        ]);
        setAvailableMeals({
          starters: starters.data || [],
          mains: mains.data || [],
          desserts: desserts.data || [],
        });
      } catch (err) {
        console.error('Failed to load meals', err);
      }
    };
    loadMeals();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (experience?.status !== 'published') {
      showToast('Publish the experience first so clients can see this menu.', 'info');
    }
    setLoading(true);
    const dietaryTagsArray = formData.dietary_tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      const result = await createMenu({
        experience_id: experienceId,
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        price_per_person: parseFloat(formData.price_per_person),
        guest_min: Number(formData.guest_min),
        guest_max: Number(formData.guest_max),
        image_url: formData.image_url,
        dietary_tags: dietaryTagsArray,
      });

      if (result && result.id) {
        // Save meal assignments
        const assignments = [];
        if (selectedMeals.starter_id && selectedMeals.starter_id !== 'none') 
            assignments.push({ meal_id: selectedMeals.starter_id, course_type: 'starter', order_index: 0 });
        if (selectedMeals.main_id && selectedMeals.main_id !== 'none') 
            assignments.push({ meal_id: selectedMeals.main_id, course_type: 'main', order_index: 1 });
        if (selectedMeals.dessert_id && selectedMeals.dessert_id !== 'none') 
            assignments.push({ meal_id: selectedMeals.dessert_id, course_type: 'dessert', order_index: 2 });
        
        await mealService.assignMealsToMenu(result.id, assignments);
        
        showToast('Menu created successfully', 'success');
        router.push(`/admin/experiences/${experienceId}/menus`);
      } else {
        showToast('Failed to create menu', 'error');
      }
    } catch (err) {
      showToast('Error saving changes', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-[#ff7642]">
          <Link href={`/admin/experiences/${experienceId}/menus`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menus
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Create Menu</h1>
        <p className="text-[#cbd5f5] mt-1">Add a new menu option for this experience.</p>
      </div>

      <Card className="bg-[#16181d] border-white/5 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-[#f9fafb]">Menu Details</CardTitle>
            <CardDescription className="text-[#cbd5f5]">
              Pricing and details for this menu option.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#f9fafb] font-medium">Menu Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Gold Tier - 3 Course"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#f9fafb] font-medium">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief summary of the menu style..."
                rows={3}
                value={formData.description}
                onChange={handleChange}
                required
                className="bg-[#1f2228] border-white/10 text-[#f9fafb]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="base_price" className="text-[#f9fafb] font-medium">Base Price (KES)</Label>
                    <Input
                        id="base_price"
                        name="base_price"
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={formData.base_price}
                        onChange={handleChange}
                        required
                        className="bg-[#1f2228] border-white/10 text-[#f9fafb]"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price_per_person" className="text-[#f9fafb] font-medium">Price per Guest (KES)</Label>
                    <Input
                        id="price_per_person"
                        name="price_per_person"
                        type="number"
                        step="0.01"
                        placeholder="2500"
                        value={formData.price_per_person}
                        onChange={handleChange}
                        required
                        className="bg-[#1f2228] border-white/10 text-[#f9fafb]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="guest_min" className="text-[#f9fafb] font-medium">Min Guests</Label>
                    <Input
                        id="guest_min"
                        name="guest_min"
                        type="number"
                        value={formData.guest_min}
                        onChange={handleChange}
                        required
                        className="bg-[#1f2228] border-white/10 text-[#f9fafb]"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="guest_max" className="text-[#f9fafb] font-medium">Max Guests</Label>
                    <Input
                        id="guest_max"
                        name="guest_max"
                        type="number"
                        value={formData.guest_max}
                        onChange={handleChange}
                        required
                        className="bg-[#1f2228] border-white/10 text-[#f9fafb]"
                    />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietary_tags" className="text-[#f9fafb] font-medium">Dietary Tags (comma separated)</Label>
              <Input
                id="dietary_tags"
                name="dietary_tags"
                placeholder="e.g. Halal, Vegan, Gluten-Free"
                value={formData.dietary_tags}
                onChange={handleChange}
                className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[#f9fafb] font-semibold text-lg">Composed Meals</Label>
                  <div className="flex items-center gap-2 bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                    <span className="text-xs text-accent/80 font-medium">Auto-Calculated Nutrition:</span>
                    <span className="text-sm font-bold text-accent">
                      {(
                        (availableMeals.starters.find(m => m.id === selectedMeals.starter_id)?.kcal || 0) +
                        (availableMeals.mains.find(m => m.id === selectedMeals.main_id)?.kcal || 0) +
                        (availableMeals.desserts.find(m => m.id === selectedMeals.dessert_id)?.kcal || 0)
                      )} kcal
                    </span>
                  </div>
                </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-[#cbd5f5] text-sm">Starter</Label>
                  <Select 
                    value={selectedMeals.starter_id} 
                    onValueChange={(v) => setSelectedMeals(prev => ({ ...prev, starter_id: v }))}
                  >
                    <SelectTrigger className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                      <SelectValue placeholder="Select a starter..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                      <SelectItem value="none">None</SelectItem>
                      {availableMeals.starters.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#cbd5f5] text-sm">Main Course</Label>
                  <Select 
                    value={selectedMeals.main_id} 
                    onValueChange={(v) => setSelectedMeals(prev => ({ ...prev, main_id: v }))}
                  >
                    <SelectTrigger className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                      <SelectValue placeholder="Select a main..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                      <SelectItem value="none">None</SelectItem>
                      {availableMeals.mains.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#cbd5f5] text-sm">Dessert</Label>
                  <Select 
                    value={selectedMeals.dessert_id} 
                    onValueChange={(v) => setSelectedMeals(prev => ({ ...prev, dessert_id: v }))}
                  >
                    <SelectTrigger className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                      <SelectValue placeholder="Select a dessert..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                      <SelectItem value="none">None</SelectItem>
                      {availableMeals.desserts.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#f9fafb] font-medium">Cover Image (required for listing)</Label>
              <div className="rounded-xl border border-dashed border-white/10 bg-[#1f2228]/50 p-1">
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  label="Upload Cover Image"
                  bucket="menus"
                  required
                  onUploadError={(msg) => showToast(msg, 'error')}
                />
              </div>
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
            <Button type="submit" disabled={loading || !formData.image_url} className="bg-[#ff7642] hover:bg-[#ff8b5f] text-white px-8">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Menu
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
