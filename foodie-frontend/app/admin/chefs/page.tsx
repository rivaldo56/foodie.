'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChefsAdmin } from '@/hooks/useChefsAdmin';
import { ChefEditDialog } from '@/components/admin/ChefEditDialog';
import {
    Users,
    Search,
    Filter,
    Pencil,
    Award,
    Clock,
    UserX,
    Loader2,
    Mail,
    MapPin,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Chef } from '@/services/chef.service';

export default function AdminChefsPage() {
    const { chefs, loading, error, fetchChefs, updateChef } = useChefsAdmin();
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [editingChef, setEditingChef] = useState<Chef | null>(null);

    useEffect(() => {
        fetchChefs();
    }, [fetchChefs]);

    const filteredChefs = chefs.filter(chef => {
        const matchesSearch =
            chef.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chef.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chef.city?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'verified' && chef.verified) ||
            (statusFilter === 'unverified' && !chef.verified);

        return matchesSearch && matchesStatus;
    });

    const handleUpdateChef = async (id: string, updates: Partial<Chef>) => {
        const result = await updateChef(id, updates);
        if (result) {
            showToast('Chef updated successfully', 'success');
            return true;
        } else {
            // Note: error is from useChefsAdmin hook
            showToast(error ?? 'Failed to update chef', 'error');
            return false;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Chef Management</h1>
                    <p className="text-[#cbd5f5] mt-1">Review and manage chef profiles and applications.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search chefs by name, bio, or city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#16181d] border-white/5 text-white"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={statusFilter === 'all' ? 'secondary' : 'outline'}
                        onClick={() => setStatusFilter('all')}
                        className={statusFilter === 'all' ? 'bg-[#ff7642] text-white hover:bg-[#ff8b5f]' : 'border-white/5 text-gray-400'}
                    >
                        All
                    </Button>
                    <Button
                        variant={statusFilter === 'verified' ? 'secondary' : 'outline'}
                        onClick={() => setStatusFilter('verified')}
                        className={statusFilter === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'border-white/5 text-gray-400'}
                    >
                        Verified
                    </Button>
                    <Button
                        variant={statusFilter === 'unverified' ? 'secondary' : 'outline'}
                        onClick={() => setStatusFilter('unverified')}
                        className={statusFilter === 'unverified' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'border-white/5 text-gray-400'}
                    >
                        Unverified
                    </Button>
                </div>
            </div>

            {loading && chefs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#ff7642]" />
                    <p className="text-gray-400 font-medium">Loading chefs...</p>
                </div>
            ) : filteredChefs.length === 0 ? (
                <Card className="bg-[#16181d] border-white/5 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center text-[#cbd5f5]">
                        <div className="bg-[#ff7642]/10 p-4 rounded-full mb-4">
                            <Users className="h-10 w-10 text-[#ff7642]" />
                        </div>
                        <p className="text-[#f9fafb] font-medium text-lg">No chefs found</p>
                        <p className="text-[#94a3b8] mt-1 max-w-md">
                            We couldn't find any chefs matching your current filters.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredChefs.map((chef) => (
                        <Card key={chef.id} className="bg-[#16181d] border-white/5 group hover:border-[#ff7642]/30 transition-all overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white/5 bg-[#1f2228] relative">
                                            {chef.profile_picture ? (
                                                <img src={chef.profile_picture} alt={chef.name} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    <Users className="h-8 w-8" />
                                                </div>
                                            )}
                                            {chef.verified && (
                                                <div className="absolute -bottom-1 -right-1 bg-[#16181d] rounded-full p-0.5">
                                                    <Award className="h-4 w-4 text-blue-400 fill-blue-400/20" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-[#ff7642] transition-colors">{chef.name || 'Unnamed Chef'}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <MapPin className="h-3 w-3" />
                                                <span>{chef.city || 'N/A'}, {chef.state || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setEditingChef(chef)}
                                        className="h-8 w-8 border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>

                                <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px] mb-4">
                                    {chef.bio || "No biography provided."}
                                </p>

                                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5 text-xs">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Award className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="capitalize">{chef.experience_level}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                                        <span>Joined {chef.created_at ? new Date(chef.created_at).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <ChefEditDialog
                chef={editingChef}
                isOpen={!!editingChef}
                onClose={() => setEditingChef(null)}
                onSave={handleUpdateChef}
            />
        </div>
    );
}
