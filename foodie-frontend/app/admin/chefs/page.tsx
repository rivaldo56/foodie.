'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Tooltip } from 'lucide-react';

export default function AdminChefsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Chef Management</h1>
        <p className="text-[#cbd5f5] mt-1">Review and manage chef profiles and applications.</p>
      </div>

      <Card className="bg-[#16181d] border-white/5 border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-[#cbd5f5]">
          <div className="bg-[#ff7642]/10 p-4 rounded-full mb-4">
            <Users className="h-10 w-10 text-[#ff7642]" />
          </div>
          <p className="text-[#f9fafb] font-medium text-lg">Chef Onboarding in Progress</p>
          <p className="text-[#94a3b8] mt-1 max-w-md">
            The chef verification and profile management system is being updated to support the new marketplace engine.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
