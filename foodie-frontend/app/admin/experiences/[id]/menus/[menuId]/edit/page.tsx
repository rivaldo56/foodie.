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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/contexts/ToastContext';
import type { UpdateMenuInput } from '@/types/marketplace';

export default function EditMenuPage() {
  const params = useParams();
  const experienceId = params.id as string;
  const menuId = params.menuId as string;
  const router = useRouter();
  const { showToast } = useToast();
  const { menus, experience, loading: hookLoading, updateMenu } = useMenusAdmin(experienceId);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateMenuInput>({
    name: '',
    description: '',
    base_price: 0,
    price_per_person: 0,
    guest_min: 2,
    guest_max: 20,
    image_url: '',
    dietary_tags: [],
    status: 'active',
  });

  const menu = menus.find((m) => m.id === menuId);

  useEffect(() => {
    if (menu) {
      setFormData({
        name: menu.name,
        description: menu.description ?? '',
        base_price: menu.base_price,
        price_per_person: menu.price_per_person,
        guest_min: menu.guest_min,
        guest_max: menu.guest_max,
        image_url: menu.image_url ?? '',
        dietary_tags: menu.dietary_tags ?? [],
        status: menu.status,
      });
    }
  }, [menu]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'dietary_tags') {
      setFormData((prev) => ({
        ...prev,
        dietary_tags: value.split(',').map((t) => t.trim()).filter(Boolean),
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await updateMenu(menuId, formData);
    setLoading(false);
    if (ok) {
      showToast('Menu updated', 'success');
      router.push(`/admin/experiences/${experienceId}/menus`);
    } else {
      showToast('Failed to update menu', 'error');
    }
  };

  if (hookLoading && menus.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-[#ff7642]" />
      </div>
    );
  }

  if (!menu && menus.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#cbd5f5]">
        <p>Menu not found.</p>
        <Button asChild variant="link" className="mt-4 text-[#ff7642]">
          <Link href={`/admin/experiences/${experienceId}/menus`}>Back to Menus</Link>
        </Button>
      </div>
    );
  }

  if (!menu) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-[#ff7642]">
          <Link href={`/admin/experiences/${experienceId}/menus`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menus
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Edit Menu</h1>
        <p className="text-[#cbd5f5] mt-1">Update menu details.</p>
      </div>

      <Card className="bg-[#16181d] border-white/5 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-[#f9fafb]">Menu Details</CardTitle>
            <CardDescription className="text-[#cbd5f5]">Pricing and details for this menu option.</CardDescription>
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
                className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500 focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#f9fafb] font-medium">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="List the courses or items included..."
                rows={4}
                value={formData.description ?? ''}
                onChange={handleChange}
                required
                className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500 focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
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
                  value={formData.base_price ?? 0}
                  onChange={(e) => setFormData((prev) => ({ ...prev, base_price: Number(e.target.value) || 0 }))}
                  required
                  className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500 focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
                />
                <p className="text-xs text-[#94a3b8]">Fixed cost regardless of guests</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_per_person" className="text-[#f9fafb] font-medium">Price per Guest (KES)</Label>
                <Input
                  id="price_per_person"
                  name="price_per_person"
                  type="number"
                  step="0.01"
                  placeholder="2500"
                  value={formData.price_per_person ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price_per_person: Number(e.target.value) || 0 }))}
                  required
                  className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500 focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
                />
                <p className="text-xs text-[#94a3b8]">Additional cost per guest</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest_min" className="text-[#f9fafb] font-medium">Min Guests</Label>
                <Input
                  id="guest_min"
                  name="guest_min"
                  type="number"
                  value={formData.guest_min ?? 2}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guest_min: Number(e.target.value) || 0 }))}
                  required
                  className="bg-[#1f2228] border-white/10 text-[#f9fafb] focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest_max" className="text-[#f9fafb] font-medium">Max Guests</Label>
                <Input
                  id="guest_max"
                  name="guest_max"
                  type="number"
                  value={formData.guest_max ?? 20}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guest_max: Number(e.target.value) || 0 }))}
                  required
                  className="bg-[#1f2228] border-white/10 text-[#f9fafb] focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietary_tags" className="text-[#f9fafb] font-medium">Dietary Tags (comma separated)</Label>
              <Input
                id="dietary_tags"
                name="dietary_tags"
                placeholder="e.g. Halal, Vegan, Gluten-Free"
                value={Array.isArray(formData.dietary_tags) ? formData.dietary_tags.join(', ') : ''}
                onChange={handleChange}
                className="bg-[#1f2228] border-white/10 text-[#f9fafb] placeholder:text-gray-500 focus:border-[#ff7642]/50 focus:ring-[#ff7642]/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#f9fafb] font-medium">Menu Image</Label>
              <div className="rounded-xl border border-dashed border-white/10 bg-[#1f2228]/50 p-1">
                <ImageUpload
                  value={formData.image_url ?? ''}
                  onChange={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
                  label="Upload Menu Image"
                  bucket="menus"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#f9fafb] font-medium">Status</Label>
              <Select
                value={formData.status ?? 'active'}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v as 'active' | 'inactive' }))}
              >
                <SelectTrigger className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                  <SelectItem value="active" className="hover:bg-[#ff7642]/10">Active</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-[#ff7642]/10">Inactive</SelectItem>
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
