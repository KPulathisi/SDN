import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Users, ShoppingBag, Truck, DollarSign, Loader2, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Analytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // In a real production app, we would use BigQuery or a dedicated 
      // analytics service, but for MVP we'll aggregate some Firestore data.
      try {
        const orderSnap = await getDocs(collection(db, 'orders'));
        const orders = orderSnap.docs.map(d => d.data());
        
        const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        const totalOrders = orders.length;
        
        // Mocking some time-series data for the charts
        const salesStats = [
          { name: 'Mon', value: 4000 },
          { name: 'Tue', value: 3000 },
          { name: 'Wed', value: 5000 },
          { name: 'Thu', value: 2780 },
          { name: 'Fri', value: 1890 },
          { name: 'Sat', value: 2390 },
          { name: 'Sun', value: 3490 },
        ];

        const rdcDistribution = [
          { name: 'Western RDC', value: 400, color: '#3B82F6' },
          { name: 'Northern RDC', value: 300, color: '#10B981' },
          { name: 'Southern RDC', value: 200, color: '#F59E0B' },
          { name: 'Eastern RDC', value: 100, color: '#EF4444' },
        ];

        setData({
          totalRevenue,
          totalOrders,
          salesStats,
          rdcDistribution,
          deliverySuccess: 94.2,
        });
      } catch (error) {
        console.error('Analytics error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Aggregating real-time insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            Performance Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Data-driven insights for network growth and optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm font-bold">
              <TrendingUp className="w-4 h-4" /> 12.5%
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          <h3 className="text-2xl font-bold dark:text-white">${data.totalRevenue.toLocaleString()}</h3>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm font-bold">
              <TrendingUp className="w-4 h-4" /> 8.2%
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
          <h3 className="text-2xl font-bold dark:text-white">{data.totalOrders}</h3>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Truck className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex items-center gap-1 text-red-600 text-sm font-bold">
              <TrendingDown className="w-4 h-4" /> 1.4%
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Success</p>
          <h3 className="text-2xl font-bold dark:text-white">{data.deliverySuccess}%</h3>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm font-bold">
              <TrendingUp className="w-4 h-4" /> 5.7%
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">New Customers</p>
          <h3 className="text-2xl font-bold dark:text-white">124</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Revenue Growth</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesStats}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#3B82F6' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Sales by Distribution Centre</h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.rdcDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.rdcDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4 ml-8">
              {data.rdcDistribution.map((rdc: any) => (
                <div key={rdc.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rdc.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{rdc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
