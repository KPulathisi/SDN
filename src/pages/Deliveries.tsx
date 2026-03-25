import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Search, Loader2, Calendar, User, Navigation, Plus } from 'lucide-react';
import { collection, query, onSnapshot, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/auth';
import { Delivery, Order } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user, hasRole } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Fetch orders for reference
    const fetchOrders = async () => {
      const orderSnap = await getDocs(collection(db, 'orders'));
      const orderMap: Record<string, Order> = {};
      orderSnap.docs.forEach(doc => {
        const data = doc.data();
        orderMap[doc.id] = { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          estimatedDelivery: data.estimatedDelivery?.toDate() || new Date(),
        } as Order;
      });
      setOrders(orderMap);
    };

    fetchOrders();

    // Real-time deliveries listener
    let q = query(collection(db, 'deliveries'));
    if (hasRole('retail_customer')) {
      // Typically deliveries don't have customerId directly, we link via orderId
      // For now, HO/Logistics see all, RDC see theirs
    } else if (hasRole('rdc_staff') && user.rdcId) {
      // Filter logic would be via order lookup, but for MVP let's assume all for staff
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deliveryList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        scheduledDate: doc.data().scheduledDate?.toDate() || new Date(),
        actualDelivery: doc.data().actualDelivery?.toDate(),
      })) as Delivery[];
      setDeliveries(deliveryList);
      setIsLoading(false);
    }, (error) => {
      console.error('Deliveries error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, hasRole]);

  const handleUpdateStatus = async (deliveryId: string, newStatus: Delivery['status']) => {
    try {
      await updateDoc(doc(db, 'deliveries', deliveryId), {
        status: newStatus,
        actualDelivery: newStatus === 'delivered' ? serverTimestamp() : null,
      });
      toast.success(`Delivery marked as ${newStatus}`);
    } catch (error: any) {
      toast.error('Update failed: ' + error.message);
    }
  };

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'en_route': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDeliveries = deliveries.filter(d => {
    const order = orders[d.orderId];
    return d.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
           order?.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());
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
            <Truck className="w-8 h-8 text-blue-500" />
            Delivery Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor real-time shipment status and fleet logistics
          </p>
        </div>

        {hasRole(['logistics', 'head_office']) && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Delivery
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by delivery ID or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading deliveries...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDeliveries.map((delivery) => (
                  <div key={delivery.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(delivery.status)}`}>
                            {delivery.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-mono text-gray-500">#{delivery.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {orders[delivery.orderId]?.deliveryAddress || 'Address Loading...'}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> Driver: {delivery.driverId}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Scheduled: {format(delivery.scheduledDate, 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {delivery.status === 'scheduled' && (
                          <Button size="sm" onClick={() => handleUpdateStatus(delivery.id, 'en_route')}>Start Delivery</Button>
                        )}
                        {delivery.status === 'en_route' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(delivery.id, 'delivered')}>
                            Complete Delivery
                          </Button>
                        )}
                        <Button variant="outline" size="sm">Details</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredDeliveries.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    No active deliveries found.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Navigation className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Live Map View</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Interactive fleet tracking map with Google Maps integration coming in the next update.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Delivery Insights</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">On-time Rate</span>
                <span className="text-green-600 font-bold">94.2%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '94.2%' }} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Active Vehicles</span>
                <span className="text-blue-600 font-bold">12 / 15</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Deliveries;
