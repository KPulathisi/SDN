import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { collection, getDocs, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, RDC, InventoryItem } from '../../types';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRdcId?: string;
}

const StockTransferModal: React.FC<StockTransferModalProps> = ({ isOpen, onClose, currentRdcId }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [rdcs, setRdcs] = useState<RDC[]>([]);
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [fromRdcId, setFromRdcId] = useState(currentRdcId || '');
  const [toRdcId, setToRdcId] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const prodSnap = await getDocs(collection(db, 'products'));
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      
      const rdcSnap = await getDocs(collection(db, 'rdcs'));
      setRdcs(rdcSnap.docs.map(d => ({ id: d.id, ...d.data() } as RDC)));
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  const handleTransfer = async () => {
    if (!selectedProductId || !fromRdcId || !toRdcId || fromRdcId === toRdcId) {
      toast.error('Invalid transfer details');
      return;
    }

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        // Query for source inventory item
        const sourceQuery = await getDocs(collection(db, 'inventory_items'));
        const sourceDoc = sourceQuery.docs.find(d => d.data().productId === selectedProductId && d.data().rdcId === fromRdcId);
        
        // Query for destination inventory item
        const destDoc = sourceQuery.docs.find(d => d.data().productId === selectedProductId && d.data().rdcId === toRdcId);

        if (!sourceDoc) throw new Error('Source inventory not found');
        const sourceData = sourceDoc.data() as InventoryItem;
        
        if (sourceData.currentStock < quantity) throw new Error('Insufficient stock in source RDC');

        // Update Source
        transaction.update(doc(db, 'inventory_items', sourceDoc.id), {
          currentStock: sourceData.currentStock - quantity,
          lastUpdated: serverTimestamp(),
        });

        // Update Destination
        if (destDoc) {
          transaction.update(doc(db, 'inventory_items', destDoc.id), {
            currentStock: (destDoc.data().currentStock || 0) + quantity,
            lastUpdated: serverTimestamp(),
          });
        } else {
          // Create destination if it doesn't exist
          const newDocRef = doc(collection(db, 'inventory_items'));
          transaction.set(newDocRef, {
            productId: selectedProductId,
            rdcId: toRdcId,
            currentStock: quantity,
            reorderLevel: 50, // Default
            lastUpdated: serverTimestamp(),
          });
        }

        // Record Movements
        const movementRefOut = doc(collection(db, 'stock_movements'));
        transaction.set(movementRefOut, {
          type: 'transfer',
          productId: selectedProductId,
          rdcId: fromRdcId,
          quantity: -quantity,
          reason: `Transfer to ${toRdcId}`,
          timestamp: serverTimestamp(),
        });

        const movementRefIn = doc(collection(db, 'stock_movements'));
        transaction.set(movementRefIn, {
          type: 'transfer',
          productId: selectedProductId,
          rdcId: toRdcId,
          quantity: quantity,
          reason: `Transfer from ${fromRdcId}`,
          timestamp: serverTimestamp(),
        });
      });

      toast.success('Stock transfer complete!');
      onClose();
    } catch (error: any) {
      toast.error('Transfer failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-500" />
            Inter-Branch Stock Transfer
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select a product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From RDC</label>
              <select
                value={fromRdcId}
                onChange={(e) => setFromRdcId(e.target.value)}
                disabled={!!currentRdcId}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select source...</option>
                {rdcs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To RDC</label>
              <select
                value={toRdcId}
                onChange={(e) => setToRdcId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select destination...</option>
                {rdcs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This action will instantly update stock levels in both distribution centres and record the transaction in the movement log.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button 
            className="flex-1" 
            loading={loading}
            onClick={handleTransfer}
            disabled={!selectedProductId || !fromRdcId || !toRdcId || fromRdcId === toRdcId}
          >
            Execute Transfer
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default StockTransferModal;
