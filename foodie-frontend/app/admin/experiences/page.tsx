'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useExperiencesAdmin } from '@/hooks/useExperiencesAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, UtensilsCrossed } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';

export default function ExperiencesPage() {
  const {
    experiences,
    loading,
    error,
    fetchExperiences,
    deleteExperience,
    togglePublish,
  } = useExperiencesAdmin();
  const { showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteExperience(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (ok) showToast('Experience deleted', 'success');
    else showToast('Failed to delete experience', 'error');
  };

  const handleTogglePublish = async (id: string) => {
    setTogglingId(id);
    const ok = await togglePublish(id);
    setTogglingId(null);
    if (ok) showToast('Status updated', 'success');
    else showToast('Failed to update status', 'error');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Experiences</h1>
          <p className="text-[#cbd5f5] mt-1">Manage curative dining experiences for your users.</p>
        </div>
        <Button asChild className="bg-[#ff7642] hover:bg-[#ff8b5f] text-white shadow-lg shadow-[#ff7642]/20 border-none">
          <Link href="/admin/experiences/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Experience
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
      ) : experiences.length === 0 ? (
        <Card className="bg-[#16181d] border-white/5 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1f2228] flex items-center justify-center mb-4">
              <UtensilsCrossed className="h-8 w-8 text-[#94a3b8]" />
            </div>
            <p className="text-[#f9fafb] font-medium">No experiences found</p>
            <p className="text-[#94a3b8] text-sm mt-1 max-w-xs">Start by creating your first curated dining experience for the platform.</p>
            <Button variant="link" asChild className="mt-4 text-[#ff7642] hover:text-[#ff8b5f]">
              <Link href="/admin/experiences/create">Create your first experience</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-8">
          {experiences.map((experience) => (
            <Card key={experience.id} className="overflow-hidden bg-[#16181d] border-white/5 hover:border-[#ff7642]/30 transition-all hover:shadow-xl group">
              <div className="aspect-video w-full bg-[#1f2228] relative overflow-hidden">
                {experience.image_url ? (
                  <img
                    src={experience.image_url}
                    alt={experience.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#94a3b8]">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] to-transparent opacity-60" />
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  {experience.status === 'published' && (
                    <span className="bg-[#ff7642] text-white text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold shadow-lg">
                      Published
                    </span>
                  )}
                  {experience.status === 'draft' && (
                    <span className="bg-[#94a3b8] text-[#0f1012] text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold">
                      Draft
                    </span>
                  )}
                  {experience.is_featured && (
                    <span className="bg-emerald-600 text-white text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold shadow-lg">
                      Featured
                    </span>
                  )}
                </div>
              </div>
              <CardHeader className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-[#f9fafb]">{experience.name}</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold tracking-widest mt-1 text-[#ff7642]">
                      {experience.category.replace('_', ' ')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-sm text-[#cbd5f5] line-clamp-2 mb-6 leading-relaxed">
                  {experience.description ?? ''}
                </p>
                <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-white/5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublish(experience.id)}
                    disabled={togglingId === experience.id}
                    className="border-white/10 text-[#cbd5f5] hover:bg-white/5"
                  >
                    {togglingId === experience.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {experience.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button variant="outline" size="sm" asChild className="border-white/10 text-[#cbd5f5] hover:bg-white/5">
                    <Link href={`/admin/experiences/${experience.id}/menus`}>Menus</Link>
                  </Button>
                  <Button variant="secondary" size="sm" asChild className="bg-[#1f2228] text-[#f9fafb] hover:bg-[#2a2f37] border-white/5">
                    <Link href={`/admin/experiences/edit/${experience.id}`}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget({ id: experience.id, name: experience.name })}
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
        title="Delete experience?"
        description={
          deleteTarget
            ? `This will permanently delete "${deleteTarget.name}" and all its menus. This action cannot be undone.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
