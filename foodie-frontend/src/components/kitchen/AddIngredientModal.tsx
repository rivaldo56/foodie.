import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { kitchenService } from '../../services/kitchen';

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({ isOpen, onClose, onAdded }) => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !qty) return;

    setLoading(true);
    try {
      await kitchenService.addToInventory({
        ingredient_name: name,
        quantity: parseFloat(qty),
        unit: unit
      });
      onAdded();
      handleClose();
    } catch (err) {
      console.error(err);
      // alert('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setQty('');
    setUnit('pcs');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-4 right-4 top-[20%] z-50 bg-surface border border-surface-stroke rounded-2xl p-6 shadow-2xl max-w-sm mx-auto"
          >
            <h3 className="text-xl font-bold text-white mb-4">Add to Pantry</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase mb-1">Ingredient Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eggs, Milk..."
                  className="w-full bg-surface-elevated border border-surface-stroke rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                    className="w-full bg-surface-elevated border border-surface-stroke rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-xs font-medium text-muted uppercase mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-surface-elevated border border-surface-stroke rounded-xl px-2 py-3 text-white focus:outline-none focus:border-accent appearance-none text-center"
                  >
                    <option value="pcs">pcs</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="oz">oz</option>
                    <option value="cups">cups</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-muted hover:bg-surface-elevated transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-accent hover:bg-accent-strong transition disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
