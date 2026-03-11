'use client';

import { useState, useEffect } from 'react';
import { Chef } from '@/services/chef.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    X,
    Loader2,
    ChefHat,
    Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChefEditDialogProps {
    chef: Chef | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Chef>) => Promise<any>;
}

export function ChefEditDialog({ chef, isOpen, onClose, onSave }: ChefEditDialogProps) {
    const [formData, setFormData] = useState<Partial<Chef>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (chef) {
            setFormData({
                name: chef.name || '',
                bio: chef.bio || '',
                experience_level: chef.experience_level || 'experienced',
                verified: chef.verified || false,
                onboarding_status: chef.onboarding_status || 'pending_verification',
                city: chef.city || '',
                state: chef.state || '',
            });
        }
    }, [chef]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chef) return;

        setSaving(true);
        
        // Only send fields that have changed and are allowed to be edited by admins
        const updates: Partial<Chef> = {};
        
        const editableFields: (keyof Chef)[] = [
            'experience_level',
            'verified',
            'onboarding_status',
            'city',
            'state'
        ];

        editableFields.forEach(field => {
            if (formData[field] !== chef[field]) {
                (updates as any)[field] = formData[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            onClose();
            return;
        }
        
        const success = await onSave(chef.id, updates);
        setSaving(false);
        if (success) {
            onClose();
        }
    };

    const handleChange = (field: keyof Chef, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const experienceLevels = ['beginner', 'intermediate', 'experienced', 'expert'];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-[#16181d] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ChefHat className="h-5 w-5 text-[#ff7642]" />
                                Edit Chef Profile
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-400">Display Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name || ''}
                                    readOnly
                                    className="bg-[#1f2228] border-white/5 text-gray-400 cursor-not-allowed"
                                    placeholder="Chef's display name"
                                />
                                <p className="text-[10px] text-gray-500 italic">Chef's name is managed by the user and cannot be edited by admins.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio" className="text-sm font-medium text-gray-400">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={formData.bio || ''}
                                    readOnly
                                    className="bg-[#1f2228] border-white/5 text-gray-400 min-h-[100px] cursor-not-allowed"
                                    placeholder="Tell something about the chef..."
                                />
                                <p className="text-[10px] text-gray-500 italic">Chef's bio is managed by the user and cannot be edited by admins.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-400">Onboarding Status</Label>
                                    <select
                                        value={formData.onboarding_status || 'pending_verification'}
                                        onChange={(e) => handleChange('onboarding_status', e.target.value)}
                                        className="w-full h-10 px-3 py-2 bg-[#1f2228] border border-white/5 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#ff7642]"
                                    >
                                        <option value="pending_verification">Pending Verification</option>
                                        <option value="approved">Approved</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-400">Experience Level</Label>
                                    <select
                                        value={formData.experience_level || 'experienced'}
                                        onChange={(e) => handleChange('experience_level', e.target.value)}
                                        className="w-full h-10 px-3 py-2 bg-[#1f2228] border border-white/5 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#ff7642]"
                                    >
                                        {experienceLevels.map(level => (
                                            <option key={level} value={level}>
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-400">City</Label>
                                <Input
                                    value={formData.city || ''}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    className="bg-[#1f2228] border-white/5 text-white"
                                    placeholder="Nairobi"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-[#1f2228]/50 rounded-xl border border-white/5">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold text-white flex items-center gap-2">
                                        <Award className="h-4 w-4 text-blue-400" />
                                        Verified Chef
                                    </Label>
                                    <p className="text-xs text-gray-400">
                                        Display verification badge on profile
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.verified || false}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('verified', e.target.checked)}
                                />
                            </div>
                        </form>

                        <div className="p-6 border-t border-white/5 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 border-white/10 text-gray-400 hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 bg-[#ff7642] hover:bg-[#ff8b5f] text-white"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
