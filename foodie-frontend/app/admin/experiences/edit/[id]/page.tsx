'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
import type { Experience, UpdateExperienceInput } from '@/types/marketplace';

const CATEGORIES = [
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

export default function EditExperiencePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { showToast } = useToast();
  const { updateExperience, fetchExperiences, experiences } = useExperiencesAdmin();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateExperienceInput>({
    name: '',
    description: '',
    category: 'other',
    image_url: '',
    is_featured: false,
    status: 'draft',
    slug: '',
  });

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const experience = experiences.find((e) => e.id === id);

  useEffect(() => {
    if (experience) {
      setFormData({
        name: experience.name,
        description: experience.description ?? '',
        category: experience.category,
        image_url: experience.image_url ?? '',
        is_featured: experience.is_featured,
        status: experience.status,
        slug: experience.slug ?? '',
      });
    }
  }, [experience]);

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
    const ok = await updateExperience(id, formData);
    setLoading(false);
    if (ok) {
      showToast('Experience updated', 'success');
      router.push('/admin/experiences');
    } else {
      showToast('Failed to update experience', 'error');
    }
  };

  if (!experience && experiences.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#cbd5f5]">
        <p>Experience not found.</p>
        <Button asChild variant="link" className="mt-4 text-[#ff7642]">
          <Link href="/admin/experiences">Back to Experiences</Link>
        </Button>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-[#ff7642]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-[#ff7642]">
          <Link href="/admin/experiences">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Experiences
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Edit Experience</h1>
        <p className="text-[#cbd5f5] mt-1">Update experience details.</p>
      </div>

      <Card className="bg-[#16181d] border-white/5 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-[#f9fafb]">Experience Details</CardTitle>
            <CardDescription className="text-[#cbd5f5]">Basic information about the experience.</CardDescription>
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
              <Select onValueChange={handleCategoryChange} value={formData.category}>
                <SelectTrigger className="bg-[#1f2228] border-white/10 text-[#f9fafb] focus:ring-[#ff7642]/20">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                  {CATEGORIES.map((cat) => (
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
                value={formData.description ?? ''}
                onChange={handleChange}
                required
                className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500 focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#f9fafb] font-medium">Cover Image</Label>
              <div className="rounded-xl border border-dashed border-white/10 bg-[#1f2228]/50 p-1">
                <ImageUpload
                  value={formData.image_url ?? ''}
                  onChange={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
                  label="Upload Cover Image"
                  bucket="experiences"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-[#f9fafb] font-medium">Slug (optional)</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="e.g. swahili-coastal-feast"
                value={formData.slug ?? ''}
                onChange={handleChange}
                className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500 focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
              />
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl bg-[#1f2228] border border-white/5">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured ?? false}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))}
                className="h-5 w-5 rounded border-white/10 bg-[#101216] text-[#ff7642] focus:ring-[#ff7642]/20 focus:ring-offset-0"
              />
              <Label htmlFor="is_featured" className="text-[#cbd5f5] font-normal cursor-pointer">
                Feature this experience on home page
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-[#f9fafb] font-medium">Status</Label>
              <Select
                value={formData.status ?? 'draft'}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v as Experience['status'] }))}
              >
                <SelectTrigger className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                  <SelectItem value="draft" className="hover:bg-[#ff7642]/10">Draft</SelectItem>
                  <SelectItem value="published" className="hover:bg-[#ff7642]/10">Published</SelectItem>
                  <SelectItem value="archived" className="hover:bg-[#ff7642]/10">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-white/5 p-6 bg-[#16181d]/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-white/10 text-[#cbd5f5] hover:bg-white/5 hover:text-[#f9fafb]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#ff7642] hover:bg-[#ff8b5f] text-white shadow-lg shadow-[#ff7642]/20 border-none px-8">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
