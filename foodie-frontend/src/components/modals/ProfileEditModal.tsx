'use client';

import { useState, useCallback } from 'react';
import { X, Upload, User } from 'lucide-react';
import Image from 'next/image';
import Cropper from 'react-easy-crop';

// Define types inline since react-easy-crop doesn't export them separately
type Point = { x: number; y: number };
type Area = { width: number; height: number; x: number; y: number };

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfilePic?: string;
    currentUsername: string;
    currentBio?: string;
    onSave: (data: { profilePic?: File; username: string; bio: string }) => Promise<void>;
}

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new window.Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', 0.9);
    });
}

export default function ProfileEditModal({
    isOpen,
    onClose,
    currentProfilePic,
    currentUsername,
    currentBio = '',
    onSave,
}: ProfileEditModalProps) {
    const [username, setUsername] = useState(currentUsername);
    const [bio, setBio] = useState(currentBio);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentProfilePic || null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCropper, setShowCropper] = useState(false);

    // Cropper state
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setOriginalImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropConfirm = async () => {
        if (!originalImage || !croppedAreaPixels) return;

        try {
            const croppedBlob = await getCroppedImg(originalImage, croppedAreaPixels);
            if (croppedBlob) {
                setCroppedImage(croppedBlob);
                const croppedUrl = URL.createObjectURL(croppedBlob);
                setPreviewUrl(croppedUrl);
                setShowCropper(false);
            }
        } catch (error) {
            console.error('Error cropping image:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let profilePicFile: File | undefined;

            if (croppedImage) {
                profilePicFile = new File([croppedImage], 'profile.jpg', { type: 'image/jpeg' });
            }

            await onSave({
                profilePic: profilePicFile,
                username,
                bio,
            });
            onClose();
        } catch (error) {
            console.error('Failed to save profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    if (showCropper && originalImage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div className="w-full max-w-2xl bg-surface-elevated rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white">Crop Profile Picture</h2>
                        <button
                            onClick={() => setShowCropper(false)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5 text-muted" />
                        </button>
                    </div>

                    {/* Cropper */}
                    <div className="relative h-96 bg-black">
                        <Cropper
                            image={originalImage}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </div>

                    {/* Zoom Control */}
                    <div className="p-6 space-y-4 border-t border-white/10">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Zoom</label>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full accent-accent"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCropper(false)}
                                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCropConfirm}
                                className="flex-1 px-6 py-3 bg-accent hover:bg-accent-strong text-white rounded-xl transition-all font-medium"
                            >
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-surface-elevated rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            {previewUrl ? (
                                <div className="relative h-30 w-30">
                                    <Image
                                        src={previewUrl}
                                        alt="Profile"
                                        width={120}
                                        height={120}
                                        className="rounded-full object-cover border-4 border-accent/20"
                                    />
                                </div>
                            ) : (
                                <div className="h-30 w-30 rounded-full bg-white/10 flex items-center justify-center border-4 border-accent/20">
                                    <User className="h-16 w-16 text-muted" />
                                </div>
                            )}
                        </div>
                        <label className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-xl transition-colors">
                                <Upload className="h-4 w-4" />
                                <span className="text-sm font-medium">Change Picture</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all"
                            placeholder="Enter your username"
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all resize-none"
                            placeholder="Tell us about yourself..."
                            maxLength={500}
                        />
                        <div className="text-xs text-muted text-right">
                            {bio.length}/500 characters
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !username.trim()}
                        className="flex-1 px-6 py-3 bg-accent hover:bg-accent-strong text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
