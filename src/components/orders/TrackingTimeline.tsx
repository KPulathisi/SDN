import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Truck, Package, MapPin } from 'lucide-react';
import { OrderStatus } from '../../types';

interface TrackingTimelineProps {
  status: OrderStatus;
}

const steps: { status: OrderStatus; label: string; icon: any; description: string }[] = [
  { status: 'pending', label: 'Order Placed', icon: Clock, description: 'We have received your order.' },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2, description: 'Distribution centre has confirmed your order.' },
  { status: 'preparing', label: 'Processing', icon: Package, description: 'Items are being packed and prepared.' },
  { status: 'dispatched', label: 'Dispatched', icon: Truck, description: 'Your order has left the facility.' },
  { status: 'in_transit', label: 'Out for Delivery', icon: MapPin, description: 'Driver is on the way to your location.' },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle2, description: 'Successfully delivered to your address.' },
];

const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ status }) => {
  const currentStepIndex = steps.findIndex(s => s.status === status);

  return (
    <div className="py-4">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        <div 
          className="absolute left-[19px] top-0 w-0.5 bg-blue-500 transition-all duration-500" 
          style={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        <div className="space-y-8">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;

            return (
              <motion.div 
                key={step.status}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-4"
              >
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 transition-colors ${
                  isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 pt-1">
                  <h4 className={`font-bold transition-colors ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {step.label}
                  </h4>
                  <p className={`text-sm ${isCurrent ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrackingTimeline;
