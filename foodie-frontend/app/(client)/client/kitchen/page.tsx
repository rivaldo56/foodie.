'use client';
import React from 'react';
import { KitchenHeader } from '@/components/kitchen/KitchenHeader';
import { InventoryWidget } from '@/components/kitchen/InventoryWidget';
import { Quick30Carousel } from '@/components/kitchen/Quick30Carousel';
import BottomNav from '@/components/BottomNav';

export default function KitchenPage() {
  return (
    <div className="min-h-screen pb-24 bg-background">
      <KitchenHeader />
      
      <div className="space-y-2">
        <InventoryWidget />
        <div className="h-2 bg-surface-elevated/30" /> {/* Divider */}
        <Quick30Carousel />
      </div>

       {/* Mobile Nav Fix: Ensure it sits on top */}
       <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}
