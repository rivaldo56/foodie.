'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useExperiencesAdmin } from '@/hooks/useExperiencesAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/contexts/ToastContext';

export default function CreateExperiencePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { createExperience } = useExperiencesAdmin();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    image_url: '',
    is_featured: false,
  });

  const categories = [
    { value: 'private_dinner', label: 'Private Dinner' },
    { value: 'meal_prep', label: 'Meal Prep' },
    { value: 'event_catering', label: 'Event Catering' },
    { value: 'cooking_class', label: 'Cooking Class' },
    { value: 'chama_party', label: 'Chama Party' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'baby_shower', label: 'Baby Shower' },
    { value: 'corporate_event', label: 'Corporate Event' },
    { value: 'other', label: 'Other' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await createExperience(formData);
    setLoading(false);
    if (result) {
      showToast('Experience created successfully', 'success');
      router.push('/admin/experiences');
    } else {
      showToast('Failed to create experience', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-orange-600">
          <Link href="/admin/experiences">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Experiences
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Experience</h1>
        <p className="text-muted-foreground">Add a new curated experience type.</p>
      </div>

      <Card className="bg-[#16181d] border-white/5 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-[#f9fafb]">Experience Details</CardTitle>
            <CardDescription className="text-[#cbd5f5]">
              Basic information about the experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#f9fafb] font-medium">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Swahili Coastal Feast"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500 focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-[#f9fafb] font-medium">Category</Label>
              <Select onValueChange={handleCategoryChange} defaultValue={formData.category}>
                <SelectTrigger className="bg-[#1f2228] border-white/10 text-[#f9fafb] focus:ring-[#ff7642]/20">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="hover:bg-[#ff7642]/10 focus:bg-[#ff7642]/10">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#f9fafb] font-medium">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what makes this experience special..."
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
                className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500 focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#f9fafb] font-medium">Cover Image (required)</Label>
              <div className="rounded-xl border border-dashed border-white/10 bg-[#1f2228]/50 p-1">
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  label="Upload Cover Image"
                  bucket="experiences"
                  required
                  onUploadError={(msg) => showToast(msg, 'error')}
                />
              </div>
            </div>
            
             <div className="flex items-center space-x-3 p-4 rounded-xl bg-[#1f2228] border border-white/5">
                <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="h-5 w-5 rounded border-white/10 bg-[#101216] text-[#ff7642] focus:ring-[#ff7642]/20 focus:ring-offset-0"
                />
                <Label htmlFor="is_featured" className="text-[#cbd5f5] font-normal cursor-pointer">Feature this experience on home page</Label>
            </div>

          </CardContent>
          <CardFooter className="flex justify-between border-t border-white/5 p-6 bg-[#16181d]/50">
            <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.back()}
                className="border-white/10 text-[#cbd5f5] hover:bg-white/5 hover:text-[#f9fafb]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.image_url} className="bg-[#ff7642] hover:bg-[#ff8b5f] text-white shadow-lg shadow-[#ff7642]/20 border-none px-8">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Experience
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
