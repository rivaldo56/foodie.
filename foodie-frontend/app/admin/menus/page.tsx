'use client';

import Link from 'next/link';
import { useAllMenusAdmin } from '@/hooks/useAllMenusAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Pencil, Trash2, Loader2, Image as ImageIcon, UtensilsCrossed, ExternalLink } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useState } from 'react';

export default function AllMenusPage() {
  const { menus, loading, error, deleteMenu, toggleActive } = useAllMenusAdmin();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">All Menus</h1>
          <p className="text-[#cbd5f5] mt-1">Global view of all menus across all experiences.</p>
        </div>
        <p className="text-sm text-[#94a3b8]">To add a menu, go to a specific experience.</p>
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
            <p className="text-[#94a3b8] mt-1">Create menus within individual experiences to see them here.</p>
            <Button variant="link" asChild className="mt-4 text-[#ff7642] hover:text-[#ff8b5f]">
              <Link href="/admin/experiences">Go to Experiences</Link>
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
                <div className="absolute top-3 left-3">
                  <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-tight">
                    {menu.experience.name}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 flex gap-2 items-center">
                  <div className="flex flex-col items-end">
                    <span className="bg-[#ff7642] text-white text-sm px-3 py-1 rounded-full font-bold shadow-lg">
                      KES {(menu.base_price + (menu.price_per_person * menu.guest_min)).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-white/60 font-medium uppercase mt-1">Starting from</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full h-fit ${menu.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-[#94a3b8] text-[#0f1012]'}`}>
                    {menu.status}
                  </span>
                </div>
              </div>
              <CardHeader className="p-5">
                <CardTitle className="text-xl text-[#f9fafb] line-clamp-1">{menu.name}</CardTitle>
                <CardDescription className="text-xs mt-1 text-[#ff7642] font-bold uppercase tracking-widest flex items-center justify-between">
                  <span>Guests: {menu.guest_min} - {menu.guest_max}</span>
                  <Link href={`/admin/experiences/${menu.experience_id}/menus`} className="text-[#94a3b8] hover:text-[#ff7642] transition-colors flex items-center gap-1">
                    Manage <ExternalLink size={10} />
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-sm text-[#cbd5f5] line-clamp-2 mb-6 leading-relaxed h-10">{menu.description ?? ''}</p>
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
                    <Link href={`/admin/experiences/${menu.experience_id}/menus/${menu.id}/edit`}>
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
