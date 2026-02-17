'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';
import { uploadImage } from '@/lib/storage';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  bucket?: string;
  required?: boolean;
  onUploadError?: (message: string) => void;
}

export function ImageUpload({ value, onChange, label = "Image", bucket = "images", required, onUploadError }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const publicUrl = await uploadImage(file, bucket);
      if (publicUrl) {
        onChange(publicUrl);
      } else {
        const msg = 'Failed to upload image. Please check if the storage bucket exists.';
        onUploadError ? onUploadError(msg) : alert(msg);
      }
    } catch (error) {
      console.error("Upload error", error);
      const msg = "An error occurred during upload.";
      onUploadError ? onUploadError(msg) : alert(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value ? (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-md border bg-gray-100 mt-2 group">
             <img src={value} alt="Uploaded" className="h-full w-full object-cover" />
             <div className="absolute top-2 right-2">
                 <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onChange('')}
                 >
                     <X className="h-3 w-3" />
                 </Button>
             </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
             <Input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="cursor-pointer"
             />
        </div>
      )}
       {uploading && <div className="text-xs text-muted-foreground flex items-center mt-1"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Uploading...</div>}
    </div>
  );
}
