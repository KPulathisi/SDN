import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CreditCard, Banknote, FileText, ExternalLink, Loader2, Plus } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/auth';
import { Payment, Order, Product } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import InvoiceModal from '../components/billing/InvoiceModal';
import toast from 'react-hot-toast';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const { user, hasRole } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // 1. Real-time payments listener
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let paymentList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        paidAt: doc.data().paidAt?.toDate(),
      })) as Payment[];

      if (hasRole('retail_customer')) {
        paymentList = paymentList.filter(p => p.customerId === user.id);
      }

      setPayments(paymentList);
      setIsLoading(false);
    }, (error) => {
      console.error('Payments error:', error);
      setIsLoading(false);
    });

    // 2. Fetch products for invoice line items
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };

    fetchProducts();

    return () => unsubscribe();
  }, [user, hasRole]);

  const handleViewInvoice = async (orderId: string) => {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        const data = orderDoc.data();
        setSelectedOrder({
          id: orderDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order);
        setIsInvoiceOpen(true);
      } else {
        toast.error('Order not found');
      }
    } catch (error) {
      toast.error('Failed to load invoice');
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            Payments & Billing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage transactions, invoices, and payment receipts
          </p>
        </div>

        {hasRole(['head_office', 'rdc_staff']) && (
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Generate Statement
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Receipt
            </Button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Received</p>
          <h3 className="text-2xl font-bold dark:text-white">
            ${payments.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </h3>
        </Card>
        <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30">
          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Pending Payments</p>
          <h3 className="text-2xl font-bold dark:text-white">
            ${payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </h3>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Active Invoices</p>
          <h3 className="text-2xl font-bold dark:text-white">{payments.length}</h3>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">Overdue</p>
          <h3 className="text-2xl font-bold dark:text-white">$0</h3>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 mr-1" /> Export CSV</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading payment records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Payment ID</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Method</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-sm">
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {payment.createdAt instanceof Date ? format(payment.createdAt, 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-blue-600">#{payment.id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        {payment.method === 'card' && <CreditCard className="w-4 h-4 text-blue-500" />}
                        {payment.method === 'cash' && <Banknote className="w-4 h-4 text-green-500" />}
                        {payment.method === 'bank_transfer' && <ExternalLink className="w-4 h-4 text-purple-500" />}
                        <span className="capitalize">{payment.method.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">${payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleViewInvoice(payment.orderId)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <FileText className="w-5 h-5 ml-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No payment records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <InvoiceModal 
        isOpen={isInvoiceOpen} 
        onClose={() => setIsInvoiceOpen(false)} 
        order={selectedOrder} 
        products={products} 
      />
    </div>
  );
};

export default Payments;
