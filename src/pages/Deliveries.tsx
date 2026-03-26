import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Search, Loader2, Calendar, User, Navigation, Plus } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/auth';
import { Delivery, Order } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ScheduleDeliveryModal from '../components/deliveries/ScheduleDeliveryModal';
import DeliveryDetailsModal from '../components/deliveries/DeliveryDetailsModal';
import { User as UserType } from '../types';

const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [drivers, setDrivers] = useState<Record<string, UserType>>({});
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [selectedOrderToSchedule, setSelectedOrderToSchedule] = useState<Order | null>(null);

  const { user, hasRole } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Fetch orders for reference and filtering
    const fetchOrders = async () => {
      let orderQuery = query(collection(db, 'orders'));
      if (hasRole('retail_customer')) {
        orderQuery = query(collection(db, 'orders'), where('customerId', '==', user.id));
      } else if (hasRole('rdc_staff') && user.rdcId) {
        orderQuery = query(collection(db, 'orders'), where('rdcId', '==', user.rdcId));
      }
      
      const orderSnap = await getDocs(orderQuery);
      const orderMap: Record<string, Order> = {};
      const pending: Order[] = [];
      orderSnap.docs.forEach(doc => {
        const data = doc.data();
        const o = { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          estimatedDelivery: data.estimatedDelivery?.toDate() || new Date(),
        } as Order;
        orderMap[doc.id] = o;
        if (o.status === 'confirmed') pending.push(o);
      });
      setOrders(orderMap);
      setAvailableOrders(pending);
    };

    const fetchDrivers = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'logistics'));
      const snap = await getDocs(q);
      const map: Record<string, UserType> = {};
      snap.docs.forEach(doc => map[doc.id] = { id: doc.id, ...doc.data() } as UserType);
      setDrivers(map);
    };

    fetchOrders();
    fetchDrivers();

    // Real-time deliveries listener
    let q = query(collection(db, 'deliveries'));
    // If retail customer, we typically need to filter by orderId IN [list of orderIds]
    // Firestore lacks small 'IN' list efficiency for many orders, but for MVP we'll filter on client 
    // or assume deliveries collection has custom filters if needed.
    // For now, if customer, we only show deliveries if we have the order record locally.

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let deliveryList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        scheduledDate: doc.data().scheduledDate?.toDate() || new Date(),
        actualDelivery: doc.data().actualDelivery?.toDate(),
      })) as Delivery[];

      // Client-side filtering for MVP
      if (hasRole('retail_customer')) {
        const myOrderIds = new Set(Object.keys(orders));
        deliveryList = deliveryList.filter(d => myOrderIds.has(d.orderId));
      } else if (hasRole('rdc_staff') && user.rdcId) {
        // Only show deliveries where the order belongs to this RDC
        deliveryList = deliveryList.filter(d => orders[d.orderId]?.rdcId === user.rdcId);
      }

      setDeliveries(deliveryList);
      setIsLoading(false);
    }, (error) => {
      console.error('Deliveries error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, hasRole, orders]);

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

        {hasRole(['rdc_staff', 'head_office']) && (
          <Button onClick={() => {
            if (availableOrders.length > 0) {
              setSelectedOrderToSchedule(availableOrders[0]);
              setIsScheduleOpen(true);
            } else {
              toast.error('No pending orders to schedule');
            }
          }}>
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
                          <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4" /> 
                            Driver: {drivers[delivery.driverId]?.name || delivery.driverId}
                          </span>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setIsDetailsOpen(true);
                          }}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                    <ScheduleDeliveryModal 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
        order={selectedOrderToSchedule} 
      />
      <DeliveryDetailsModal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        delivery={selectedDelivery} 
        order={selectedDelivery ? orders[selectedDelivery.orderId] : null}
        driver={selectedDelivery ? drivers[selectedDelivery.driverId] : null}
      />
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
