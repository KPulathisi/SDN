import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Order } from '../../types';
import TrackingTimeline from './TrackingTimeline';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Track Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500 text-sm">Order ID</span>
              <span className="font-mono font-bold text-blue-500">#{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="text-gray-900 dark:text-white font-medium text-lg">
              Status: <span className="text-blue-500 capitalize">{order.status.replace('_', ' ')}</span>
            </div>
          </div>

          <TrackingTimeline status={order.status} />
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
           <p className="text-xs text-center text-gray-500">
             Real-time updates provided by ISDN Logistics Network.
           </p>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderTrackingModal;
