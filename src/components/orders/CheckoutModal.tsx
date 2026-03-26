import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, MapPin, CheckCircle, Truck, CreditCard } from 'lucide-react';
import { useCartStore } from '../../store/cart';
import { useAuthStore } from '../../store/auth';
import Button from '../ui/Button';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'cart' | 'address' | 'payment' | 'confirmation'>('cart');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentData, setPaymentData] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
  
  const { items, getTotalPrice, clearCart, removeItem, updateQuantity } = useCartStore();
  const { user } = useAuthStore();

  const handlePlaceOrder = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const totalAmount = getTotalPrice();
      const orderData = {
        customerId: user.id,
        rdcId: user.rdcId || 'central-rdc',
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.product.price * item.quantity,
        })),
        totalAmount,
        status: 'pending',
        deliveryAddress: address,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(orderRef.id);

      // Create Payment document
      await addDoc(collection(db, 'payments'), {
        orderId: orderRef.id,
        customerId: user.id,
        amount: totalAmount,
        status: 'completed', // Dummy payment always succeeds
        method: 'card',
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp(),
      });
      
      clearCart();
      setStep('confirmation');
      toast.success('Order placed and payment confirmed!');
    } catch (error: any) {
      toast.error('Failed to process: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {step === 'cart' && <><ShoppingBag className="w-6 h-6 text-blue-500" /> My Cart</>}
            {step === 'address' && <><MapPin className="w-6 h-6 text-blue-500" /> Delivery Address</>}
            {step === 'payment' && <><CreditCard className="w-6 h-6 text-blue-500" /> Secure Payment</>}
            {step === 'confirmation' && <><CheckCircle className="w-6 h-6 text-green-500" /> Order Confirmed</>}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 'cart' && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    {items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{item.product.name}</h4>
                          <p className="text-sm text-gray-500">${item.product.price} / {item.product.unit}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="font-bold text-gray-900 dark:text-white">${(item.product.price * item.quantity).toFixed(2)}</p>
                          <button onClick={() => removeItem(item.product.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </motion.div>
            )}

            {step === 'address' && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full business or residence address"
                    className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Estimated delivery within 24-48 hours.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-gray-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <CreditCard className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-12 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-inner" />
                      <span className="font-bold text-xl italic text-gray-300">CARD</span>
                    </div>
                    <div className="space-y-6">
                      <div className="text-2xl font-mono tracking-widest break-all">
                        {paymentData.cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Card Holder</p>
                          <p className="font-medium tracking-wide uppercase">{paymentData.cardName || 'YOUR NAME'}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Expires</p>
                          <p className="font-medium tracking-wide">{paymentData.expiry || 'MM/YY'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Card Number</label>
                    <input
                      type="text"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Expiry Date</label>
                    <input
                      type="text"
                      value={paymentData.expiry}
                      onChange={(e) => setPaymentData({ ...paymentData, expiry: e.target.value })}
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">CVV</label>
                    <input
                      type="password"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                      placeholder="•••"
                      maxLength={3}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'confirmation' && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank you for your order!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your order <span className="font-mono font-bold text-blue-500">#{orderId.slice(-8).toUpperCase()}</span> has been placed and is being processed by the regional distribution centre.
                </p>
                <Button onClick={onClose} className="w-full">Back to Products</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step !== 'confirmation' && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">${getTotalPrice().toFixed(2)}</span>
            </div>
            
            <div className="flex gap-4">
              {step === 'cart' ? (
                <Button 
                  disabled={items.length === 0} 
                  onClick={() => setStep('address')}
                  className="flex-1"
                >
                  Continue to Address
                </Button>
              ) : step === 'address' ? (
                <>
                  <Button variant="secondary" onClick={() => setStep('cart')}>Back</Button>
                  <Button 
                    disabled={!address.trim()} 
                    onClick={() => setStep('payment')}
                    className="flex-1"
                  >
                    Continue to Payment
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setStep('address')} disabled={loading}>Back</Button>
                  <Button 
                    onClick={handlePlaceOrder} 
                    loading={loading} 
                    disabled={!paymentData.cardNumber || !paymentData.cardName}
                    className="flex-1"
                  >
                    Pay & Place Order
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CheckoutModal;
