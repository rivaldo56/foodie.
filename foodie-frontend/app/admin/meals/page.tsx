'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMealsAdmin } from '@/hooks/useMealsAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Utensils, Star, Calendar } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { Badge } from '@/components/ui/badge';

export default function MealsPage() {
  const {
    meals,
    loading,
    error,
    fetchMeals,
    deleteMeal,
    toggleActive,
  } = useMealsAdmin();
  const { showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteMeal(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (ok) showToast('Meal deleted', 'success');
    else showToast('Failed to delete meal', 'error');
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    const ok = await toggleActive(id, currentStatus);
    setTogglingId(null);
    if (ok) showToast('Status updated', 'success');
    else showToast('Failed to update status', 'error');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Meals Management</h1>
          <p className="text-[#cbd5f5] mt-1">Manage atomic dishes that can be reused across menus.</p>
        </div>
        <Button asChild className="bg-[#ff7642] hover:bg-[#ff8b5f] text-white shadow-lg shadow-[#ff7642]/20 border-none">
          <Link href="/admin/meals/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Meal
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-10 w-10 animate-spin text-[#ff7642]" />
        </div>
      ) : meals.length === 0 ? (
        <Card className="bg-[#16181d] border-white/5 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1f2228] flex items-center justify-center mb-4">
              <Utensils className="h-8 w-8 text-[#94a3b8]" />
            </div>
            <p className="text-[#f9fafb] font-medium">No meals found</p>
            <p className="text-[#94a3b8] text-sm mt-1 max-w-xs">Start by creating your first atomic dish.</p>
            <Button variant="link" asChild className="mt-4 text-[#ff7642] hover:text-[#ff8b5f]">
              <Link href="/admin/meals/create">Create your first meal</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-8">
          {meals.map((meal) => (
            <Card key={meal.id} className="overflow-hidden bg-[#16181d] border-white/5 hover:border-[#ff7642]/30 transition-all hover:shadow-xl group">
              <div className="aspect-video w-full bg-[#1f2228] relative overflow-hidden">
                {meal.image_url ? (
                  <img
                    src={meal.image_url}
                    alt={meal.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#94a3b8]">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] to-transparent opacity-60" />
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  <Badge className={`${meal.is_active ? 'bg-[#ff7642]' : 'bg-[#94a3b8]'} text-white border-none uppercase text-[10px] tracking-widest px-2.5 py-1 font-bold shadow-lg`}>
                    {meal.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#1f2228]/80 text-[#f9fafb] border-white/10 uppercase text-[10px] tracking-widest px-2.5 py-1 font-bold">
                    {meal.category}
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-[#f9fafb]">{meal.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2">
                       <div className="flex items-center text-xs text-[#94a3b8]">
                         <Calendar className="h-3 w-3 mr-1 text-[#ff7642]" />
                         {meal.total_bookings} bookings
                       </div>
                       <div className="flex items-center text-xs text-[#94a3b8]">
                         <Star className="h-3 w-3 mr-1 text-[#ff7642]" />
                         {meal.average_rating} rating
                       </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-sm text-[#cbd5f5] line-clamp-2 mb-6 leading-relaxed">
                  {meal.description ?? 'No description provided.'}
                </p>
                <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-white/5">
                   <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(meal.id, meal.is_active)}
                    disabled={togglingId === meal.id}
                    className="border-white/10 text-[#cbd5f5] hover:bg-white/5 h-8 text-xs"
                  >
                    {togglingId === meal.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    {meal.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="secondary" size="sm" asChild className="bg-[#1f2228] text-[#f9fafb] hover:bg-[#2a2f37] border-white/5 h-8 text-xs">
                    <Link href={`/admin/meals/edit/${meal.id}`}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget({ id: meal.id, name: meal.name })}
                    className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-none h-8 text-xs"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete meal?"
        description={
          deleteTarget
            ? `This will permanently delete "${deleteTarget.name}". Any menus using this meal will no longer display it. This action cannot be undone.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
