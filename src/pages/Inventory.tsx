import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, ArrowRightLeft, AlertCircle, Loader2, Plus, History } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/auth';
import { InventoryItem, Product, RDC } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StockTransferModal from '../components/inventory/StockTransferModal';
import StockAdjustModal from '../components/inventory/StockAdjustModal';
import StockHistoryModal from '../components/inventory/StockHistoryModal';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [rdcs, setRdcs] = useState<Record<string, RDC>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const { user, hasRole } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Fetch products and RDCs for reference
    const fetchData = async () => {
      const prodSnap = await getDocs(collection(db, 'products'));
      const prodMap: Record<string, Product> = {};
      prodSnap.docs.forEach(doc => prodMap[doc.id] = { id: doc.id, ...doc.data() } as Product);
      setProducts(prodMap);

      const rdcSnap = await getDocs(collection(db, 'rdcs'));
      const rdcMap: Record<string, RDC> = {};
      rdcSnap.docs.forEach(doc => rdcMap[doc.id] = { id: doc.id, ...doc.data() } as RDC);
      setRdcs(rdcMap);
    };

    fetchData();

    // Real-time inventory listener
    let q = query(collection(db, 'inventory_items'));
    if (hasRole('rdc_staff') && user.rdcId) {
      q = query(collection(db, 'inventory_items'), where('rdcId', '==', user.rdcId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
      })) as InventoryItem[];
      setItems(inventoryList);
      setIsLoading(false);
    }, (error) => {
      console.error('Inventory error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, hasRole]);

  const filteredItems = items.filter(item => {
    const product = products[item.productId];
    const matchesSearch = product?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product?.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-500" />
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time stock levels across distribution centres
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
            <History className="w-4 h-4 mr-2" />
            Stock History
          </Button>
          <Button onClick={() => setIsTransferModalOpen(true)}>
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Transfer Stock
          </Button>
        </div>
      </motion.div>

      <StockTransferModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        currentRdcId={user?.rdcId}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-lg text-white">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Items</p>
              <h3 className="text-2xl font-bold dark:text-white">{items.length}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500 rounded-lg text-white">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold dark:text-white">
                {items.filter(i => i.currentStock <= i.reorderLevel).length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 rounded-lg text-white">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Distribution Centres</p>
              <h3 className="text-2xl font-bold dark:text-white">{Object.keys(rdcs).length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading inventory data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">SKU</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">RDC</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Current Stock</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Level Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => {
                  const product = products[item.productId];
                  const rdc = rdcs[item.rdcId];
                  const isLow = item.currentStock <= item.reorderLevel;

                  return (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product?.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <span className="font-medium text-gray-900 dark:text-white">{product?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-sm">{product?.sku}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{rdc?.name}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {item.currentStock} {product?.unit}s
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isLow ? (
                          <span className="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md text-xs font-bold uppercase">
                            <AlertCircle className="w-3.5 h-3.5" /> Reorder Soon
                          </span>
                        ) : (
                          <span className="text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md text-xs font-bold uppercase">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setIsAdjustOpen(true)}
                          className="text-blue-500 hover:text-blue-600 font-semibold text-sm"
                        >
                          Adjust
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <StockAdjustModal 
        isOpen={isAdjustOpen} 
        onClose={() => setIsAdjustOpen(false)} 
        rdcId={user?.rdcId || 'central-rdc'} 
      />
      <StockHistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        rdcId={user?.rdcId || 'central-rdc'} 
      />
    </div>
  );
};

export default Inventory;
