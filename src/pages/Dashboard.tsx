import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  DollarSign,
  TrendingUp,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import KPICard from '../components/dashboard/KPICard';
import Card from '../components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    orders: 0,
    sales: 0,
    pending: 0,
    delivered: 0,
    inventory: 0,
    deliveriesCount: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // In a real app, these would be aggregated or server-side. 
        // For MVP, we'll fetch and count.
        
        let ordersQuery = query(collection(db, 'orders'));
        if (hasRole('retail_customer')) {
          ordersQuery = query(collection(db, 'orders'), where('customerId', '==', user.id));
        } else if (hasRole('rdc_staff') && user.rdcId) {
          ordersQuery = query(collection(db, 'orders'), where('rdcId', '==', user.rdcId));
        }

        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => doc.data());
        
        const totalSales = ordersData.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
        const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
        const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length;

        let inventoryCount = 0;
        if (hasRole(['head_office', 'rdc_staff'])) {
          const invQuery = hasRole('head_office') 
            ? query(collection(db, 'inventory_items'))
            : query(collection(db, 'inventory_items'), where('rdcId', '==', user.rdcId));
          const invSnapshot = await getDocs(invQuery);
          inventoryCount = invSnapshot.docs.length;
        }

        let deliveriesCount = 0;
        if (hasRole(['head_office', 'logistics', 'rdc_staff'])) {
          const delQuery = query(collection(db, 'deliveries')); // Filter logic could be more complex
          const delSnapshot = await getDocs(delQuery);
          deliveriesCount = delSnapshot.docs.length;
        }

        setStats({
          orders: ordersSnapshot.docs.length,
          sales: totalSales,
          pending: pendingOrders,
          delivered: deliveredOrders,
          inventory: inventoryCount,
          deliveriesCount: deliveriesCount,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, hasRole]);

  // Demo data for charts
  const salesData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 5500 },
  ];

  const getKPIs = () => {
    if (hasRole('retail_customer')) {
      return [
        { title: 'My Orders', value: stats.orders, icon: ShoppingBag, color: 'blue' as const },
        { title: 'Total Spent', value: `$${stats.sales.toLocaleString()}`, icon: DollarSign, color: 'green' as const },
        { title: 'Pending Orders', value: stats.pending, icon: Package, color: 'yellow' as const },
        { title: 'Delivered', value: stats.delivered, icon: Truck, color: 'green' as const },
      ];
    }

    if (hasRole(['rdc_staff', 'logistics', 'head_office'])) {
      return [
        { title: 'Total Sales', value: `$${stats.sales.toLocaleString()}`, icon: DollarSign, color: 'green' as const },
        { title: 'Active Orders', value: stats.orders, icon: ShoppingBag, color: 'blue' as const },
        { title: 'Inventory Items', value: stats.inventory, icon: Package, color: 'yellow' as const },
        { title: 'Deliveries', value: stats.deliveriesCount, icon: Truck, color: 'red' as const },
      ];
    }

    return [];
  };

  const kpis = getKPIs();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-blue-100 text-lg">
          {hasRole('retail_customer') 
            ? 'Discover new products and track your orders'
            : 'Monitor your business performance and manage operations'
          }
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <KPICard {...kpi} />
            </motion.div>
          ))}
        </div>
      )}

      {hasRole(['head_office', 'rdc_staff']) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sales Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {[
                { action: 'New order #1234', time: '2 minutes ago', type: 'order' },
                { action: 'Stock updated for SKU-001', time: '15 minutes ago', type: 'inventory' },
                { action: 'Payment received', time: '1 hour ago', type: 'payment' },
                { action: 'Delivery completed', time: '2 hours ago', type: 'delivery' },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    activity.type === 'order' ? 'bg-blue-500' :
                    activity.type === 'inventory' ? 'bg-yellow-500' :
                    activity.type === 'payment' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`} />
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;