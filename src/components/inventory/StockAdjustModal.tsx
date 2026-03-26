import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Package, ArrowUpRight, ArrowDownRight, Loader2, AlertTriangle } from 'lucide-react';
import { doc, runTransaction, serverTimestamp, collection, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { InventoryItem, Product, StockMovement } from '../../types';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  rdcId: string;
}

const StockAdjustModal: React.FC<StockAdjustModalProps> = ({ isOpen, onClose, rdcId }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [prodSnap, invSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(query(collection(db, 'inventory_items'), where('rdcId', '==', rdcId)))
        ]);

        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setInventory(invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        toast.error('Failed to load inventory data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen, rdcId]);

  const invItem = inventory.find(i => i.productId === selectedProductId);
  const currentStock = invItem?.currentStock || 0;
  const newStock = currentStock + adjustment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || adjustment === 0 || !reason) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newStock < 0) {
      toast.error('Stock cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const invRef = invItem 
        ? doc(db, 'inventory_items', invItem.id)
        : doc(collection(db, 'inventory_items'));

      await runTransaction(db, async (transaction) => {
        const movement: StockMovement = {
          id: crypto.randomUUID(),
          type: adjustment > 0 ? 'in' : adjustment < 0 ? 'out' : 'transfer',
          quantity: Math.abs(adjustment),
          reason,
          timestamp: new Date(),
          userId: 'staff-id', // Use real ID in prod
        };

        if (invItem) {
          transaction.update(invRef, {
            currentStock: newStock,
            lastUpdated: serverTimestamp(),
            movements: arrayUnion(movement)
          });
        } else {
          transaction.set(invRef, {
            productId: selectedProductId,
            rdcId,
            currentStock: newStock,
            reorderLevel: 10,
            lastUpdated: serverTimestamp(),
            movements: [movement]
          });
        }
      });

      toast.success('Inventory updated successfully');
      onClose();
      setSelectedProductId('');
      setAdjustment(0);
      setReason('');
    } catch (error: any) {
      toast.error('Update failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* UI Remains similar but uses currentStock and newStock */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" /> Adjust Stock
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-500">Syncing inventory...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">Current Stock:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{currentStock} units</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Adjustment (+/-)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={adjustment}
                        onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {adjustment > 0 ? <ArrowUpRight className="text-green-500 w-5 h-5" /> : 
                         adjustment < 0 ? <ArrowDownRight className="text-red-500 w-5 h-5" /> : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">New Total:</span>
                  <span className={`text-xl font-black ${newStock < 10 ? 'text-orange-500' : 'text-blue-600'}`}>
                    {newStock} units
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Adjustment
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Damaged items, periodic restock, inventory audit..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-24"
                  required
                />
              </div>

              {newStock < 10 && adjustment < 0 && (
                <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p>Warning: This adjustment will bring the stock below threshold.</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" loading={loading} className="flex-1" disabled={adjustment === 0}>
                  Apply
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StockAdjustModal;
