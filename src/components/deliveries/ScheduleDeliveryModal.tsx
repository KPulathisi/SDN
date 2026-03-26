import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Truck, User, Calendar, MapPin } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, User as UserType } from '../../types';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface ScheduleDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const ScheduleDeliveryModal: React.FC<ScheduleDeliveryModalProps> = ({ isOpen, onClose, order }) => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<UserType[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchDrivers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'logistics'));
        const snap = await getDocs(q);
        setDrivers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserType)));
      } catch (error) {
        toast.error('Failed to load drivers');
      } finally {
        
      }
    };

    fetchDrivers();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !selectedDriverId || !vehicleId || !scheduledDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Delivery Document
      await addDoc(collection(db, 'deliveries'), {
        orderId: order.id,
        driverId: selectedDriverId,
        vehicleId,
        status: 'scheduled',
        scheduledDate: new Date(scheduledDate),
        rdcId: order.rdcId,
        route: [], // Will be populated by driver app or automated route
        createdAt: serverTimestamp(),
      });

      // 2. Update Order Status
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'processing',
        updatedAt: serverTimestamp(),
      });

      toast.success('Delivery scheduled successfully');
      onClose();
    } catch (error: any) {
      toast.error('Scheduling failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" /> Schedule Delivery
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Order Details</span>
              <span className="text-xs font-mono text-blue-500">#{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> {order.deliveryAddress}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign Driver
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Select Driver --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vehicle Number / ID
            </label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                placeholder="e.g., LB-1234"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scheduled Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Confirm Schedule
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ScheduleDeliveryModal;
