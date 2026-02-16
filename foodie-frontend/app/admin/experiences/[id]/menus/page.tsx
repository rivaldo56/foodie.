'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMenusAdmin } from '@/hooks/useMenusAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, Image as ImageIcon, UtensilsCrossed } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useState } from 'react';

export default function ExperienceMenusPage() {
  const params = useParams();
  const experienceId = params.id as string;
  const {
    menus,
    experience,
    loading,
    error,
    deleteMenu,
    toggleActive,
  } = useMenusAdmin(experienceId);
  const { showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteMenu(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (ok) showToast('Menu deleted', 'success');
    else showToast('Failed to delete menu', 'error');
  };

  const handleToggleActive = async (id: string) => {
    setTogglingId(id);
    const ok = await toggleActive(id);
    setTogglingId(null);
    if (ok) showToast('Menu status updated', 'success');
    else showToast('Failed to update menu status', 'error');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff7642]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" asChild className="mb-4 pl-0 text-[#cbd5f5] hover:bg-transparent hover:text-[#ff7642]">
          <Link href="/admin/experiences">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Experiences
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Menus for {experience?.name}</h1>
            <p className="text-[#cbd5f5] mt-1">Manage menu options available for this experience.</p>
            {experience?.status !== 'published' && (
              <p className="text-amber-400 text-sm mt-1">Publish the experience first so clients can see these menus.</p>
            )}
          </div>
          <Button asChild className="bg-[#ff7642] hover:bg-[#ff8b5f] text-white shadow-lg shadow-[#ff7642]/20 border-none">
            <Link href={`/admin/experiences/${experienceId}/menus/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Menu
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {menus.length === 0 ? (
        <Card className="bg-[#16181d] border-white/5 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-[#cbd5f5]">
            <UtensilsCrossed className="h-10 w-10 text-[#94a3b8] mb-4" />
            <p className="text-[#f9fafb] font-medium text-lg">No menus found</p>
            <p className="text-[#94a3b8] mt-1">Add some menus to showcase the potential of this experience.</p>
            <Button variant="link" asChild className="mt-4 text-[#ff7642] hover:text-[#ff8b5f]">
              <Link href={`/admin/experiences/${experienceId}/menus/create`}>Create first menu</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-8">
          {menus.map((menu) => (
            <Card key={menu.id} className="overflow-hidden bg-[#16181d] border-white/5 hover:border-[#ff7642]/30 transition-all hover:shadow-xl group">
              <div className="aspect-video w-full bg-[#1f2228] relative overflow-hidden">
                {menu.image_url ? (
                  <img
                    src={menu.image_url}
                    alt={menu.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#94a3b8]">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] to-transparent opacity-60" />
                <div className="absolute bottom-3 right-3 flex gap-2 items-center">
                  <span className="bg-[#ff7642] text-white text-sm px-3 py-1 rounded-full font-bold shadow-lg">
                    KES {menu.price_per_person.toLocaleString()}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${menu.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-[#94a3b8] text-[#0f1012]'}`}>
                    {menu.status}
                  </span>
                </div>
              </div>
              <CardHeader className="p-5">
                <CardTitle className="text-xl text-[#f9fafb]">{menu.name}</CardTitle>
                <CardDescription className="text-xs mt-1 text-[#ff7642] font-bold uppercase tracking-widest">
                  Guests: {menu.guest_min} - {menu.guest_max}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-sm text-[#cbd5f5] line-clamp-2 mb-6 leading-relaxed">{menu.description ?? ''}</p>
                <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-white/5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(menu.id)}
                    disabled={togglingId === menu.id}
                    className="border-white/10 text-[#cbd5f5] hover:bg-white/5"
                  >
                    {togglingId === menu.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {menu.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="secondary" size="sm" asChild className="bg-[#1f2228] text-[#f9fafb] hover:bg-[#2a2f37] border-white/5">
                    <Link href={`/admin/experiences/${experienceId}/menus/${menu.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget({ id: menu.id, name: menu.name })}
                    className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete menu?"
        description={deleteTarget ? `This will permanently delete "${deleteTarget.name}". This action cannot be undone.` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
