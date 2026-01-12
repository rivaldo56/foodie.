import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { kitchenService } from '../../services/kitchen';
import { AddIngredientModal } from './AddIngredientModal';

export const InventoryWidget = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await kitchenService.getInventory();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdded = () => {
    loadInventory(); // Refresh list
  };

  if (loading) return <div className="p-6 h-24 animate-pulse bg-surface rounded-xl mx-4" />;

  return (
    <>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-white">My Pantry</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-accent text-sm font-medium hover:text-accent-strong"
          >
            + Add
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {items.length === 0 ? (
            <div className="text-muted text-sm italic">Your pantry is empty.</div>
          ) : (
            items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="min-w-[100px] p-3 rounded-xl bg-surface border border-surface-stroke flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-xl">
                  🥗
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white line-clamp-1">{item.ingredient_details.name}</div>
                  <div className="text-xs text-muted">{item.quantity} {item.unit}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      <AddIngredientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdded={handleAdded}
      />
    </>
  );
};
