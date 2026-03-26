import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, History, Search, ArrowUpRight, ArrowDownRight, Package, Calendar, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, InventoryItem, StockMovement } from '../../types';
import { format } from 'date-fns';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rdcId: string;
}

interface FlattenedMovement extends StockMovement {
  productId: string;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ isOpen, onClose, rdcId }) => {
  const [movements, setMovements] = useState<FlattenedMovement[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      // Products for names
      const prodSnap = await getDocs(collection(db, 'products'));
      const prodMap: Record<string, Product> = {};
      prodSnap.docs.forEach(doc => prodMap[doc.id] = { id: doc.id, ...doc.data() } as Product);
      setProducts(prodMap);

      // InventoryItems for this RDC
      const q = query(collection(db, 'inventory_items'), where('rdcId', '==', rdcId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allMovements: FlattenedMovement[] = [];
        snapshot.docs.forEach(doc => {
          const item = doc.data() as InventoryItem;
          if (item.movements) {
            item.movements.forEach(m => {
              allMovements.push({
                ...m,
                productId: item.productId,
                timestamp: (m.timestamp as any)?.toDate() || new Date(m.timestamp)
              });
            });
          }
        });
        
        // Sort by timestamp
        allMovements.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setMovements(allMovements);
        setLoading(false);
      });

      return unsubscribe;
    };

    const unsubPromise = fetchData();
    return () => { unsubPromise.then(unsub => unsub?.()); };
  }, [isOpen, rdcId]);

  const filteredHistory = movements.filter(m => {
    const productName = products[m.productId]?.name.toLowerCase() || '';
    return productName.includes(searchTerm.toLowerCase()) || m.reason.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-6 h-6 text-blue-500" /> Inventory Audit Log
            </h2>
            <p className="text-sm text-gray-500 mt-1">Movement history for RDC: {rdcId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Filter by product or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No movement history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4 text-center">Amount</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                  {filteredHistory.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(m.timestamp, 'MMM d, HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {products[m.productId]?.name || 'Unknown Product'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          m.type === 'in' ? 'bg-green-50 border-green-200 text-green-700' :
                          m.type === 'transfer' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          'bg-orange-50 border-orange-200 text-orange-700'
                        }`}>
                          {m.type === 'in' ? 'Restock' : m.type === 'out' ? 'Adjustment' : 'Transfer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        <div className="flex items-center justify-center gap-1">
                          {m.type === 'in' ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                          {m.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 italic max-w-xs truncate" title={m.reason}>
                        {m.reason}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">{m.userId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StockHistoryModal;
