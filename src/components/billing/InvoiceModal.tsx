import React from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Package, Mail, MapPin } from 'lucide-react';
import { Order, Product } from '../../types';
import { format } from 'date-fns';
import Button from '../ui/Button';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  products: Product[];
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order, products }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const calculateSubtotal = () => {
    return order.items.reduce((acc, item) => acc + (item.totalPrice || (item.unitPrice * item.quantity)), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.15; // 15% VAT example

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl min-h-[90vh] my-8 flex flex-col print:shadow-none print:m-0"
      >
        {/* Modal Header - Hidden on print */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg">
                <Package className="text-white w-6 h-6" />
             </div>
             <h2 className="text-xl font-bold dark:text-white text-gray-900">Digital Invoice</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-12 print:p-0 flex-1 bg-white" id="invoice-content">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-4xl font-black text-blue-600 mb-2">ISLANDLINK</h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Logistics Platform</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <p className="text-gray-500 font-mono">#{order.id.slice(-12).toUpperCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Billed To</p>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Customer Details</h3>
              <p className="text-gray-600 flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-blue-500" /> {order.deliveryAddress}
              </p>
              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" /> customer@example.com
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Invoice Meta</p>
              <div className="space-y-1">
                 <p className="text-gray-600"><span className="font-bold text-gray-900">Date:</span> {format(order.createdAt || new Date(), 'MMMM d, yyyy')}</p>
                 <p className="text-gray-600"><span className="font-bold text-gray-900">Status:</span> 
                    <span className="ml-2 uppercase text-[10px] font-black px-2 py-0.5 bg-green-100 text-green-700 rounded">
                       {order.status}
                    </span>
                 </p>
              </div>
            </div>
          </div>

          <table className="w-full mb-12">
            <thead>
              <tr className="border-b-2 border-gray-900 text-left">
                <th className="py-4 font-black uppercase text-sm">Description</th>
                <th className="py-4 font-black uppercase text-sm text-center">Quantity</th>
                <th className="py-4 font-black uppercase text-sm text-right">Price</th>
                <th className="py-4 font-black uppercase text-sm text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item, idx) => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <tr key={idx}>
                    <td className="py-6">
                      <p className="font-bold text-gray-900">{product?.name || 'Item Name'}</p>
                      <p className="text-xs text-gray-500">Unit: {product?.unit || 'pcs'}</p>
                    </td>
                    <td className="py-6 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-6 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-6 text-right font-bold text-gray-900">${(item.totalPrice || (item.unitPrice * item.quantity)).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-80 space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT (15%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-4 border-t-2 border-gray-900 text-xl font-black text-gray-900">
                <span>Total Amount</span>
                <span>${(subtotal + tax).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-12 border-t border-gray-100">
             <div className="grid grid-cols-3 gap-8">
                <div>
                   <h4 className="font-bold text-sm mb-2">Payment Info</h4>
                   <p className="text-xs text-gray-500">Bank Transfer / Credit Card<br/>Reference: INV-{order.id.slice(-6).toUpperCase()}</p>
                </div>
                <div>
                   <h4 className="font-bold text-sm mb-2">Terms</h4>
                   <p className="text-xs text-gray-500">Please make payment within 15 days of receiving this invoice.</p>
                </div>
                <div className="text-right">
                   <h4 className="font-bold text-sm mb-2">Contact</h4>
                   <p className="text-xs text-gray-500">support@islandlink.lk<br/>+94 11 234 5678</p>
                </div>
             </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 text-center text-xs text-gray-400 print:hidden">
          Thank you for choosing IslandLink Logistics.
        </div>
      </motion.div>
    </div>
  );
};

export default InvoiceModal;
