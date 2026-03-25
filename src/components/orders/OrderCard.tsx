import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, Check, X } from 'lucide-react';
import { Order } from '../../types';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

interface OrderCardProps {
  order: Order;
  onTrack?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onTrack }) => {
  const { hasRole } = useAuthStore();

  const handleUpdateStatus = async (newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Order ${newStatus} successfully!`);
    } catch (error: any) {
      toast.error('Failed to update order: ' + error.message);
    }
  };

  const getStatusIcon = () => {
    switch (order.status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'dispatched':
      case 'in_transit':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (order.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'dispatched':
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Order #{order.id.slice(-8)}
          </h3>
          <p className="text-sm text-gray-500">
            {format(order.createdAt, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Items:</span>
          <span className="font-medium">{order.items.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total:</span>
          <span className="font-semibold text-green-600">
            ${order.totalAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Delivery:</span>
          <span className="font-medium">
            {format(order.estimatedDelivery, 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      <div className="border-t pt-4 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-4">
          <span className="font-medium">Address:</span> {order.deliveryAddress}
        </p>

        {order.status === 'pending' && hasRole(['rdc_staff', 'head_office']) && (
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleUpdateStatus('confirmed')}
            >
              <Check className="w-4 h-4 mr-1" /> Accept
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleUpdateStatus('cancelled')}
            >
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
          </div>
        )}

        {order.status === 'confirmed' && hasRole(['rdc_staff', 'head_office']) && (
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => handleUpdateStatus('preparing')}
          >
            Start Preparing
          </Button>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
          onClick={onTrack}
        >
          Track Order
        </Button>
      </div>
    </motion.div>
  );
};

export default OrderCard;