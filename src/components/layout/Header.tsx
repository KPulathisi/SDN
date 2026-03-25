import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Moon, Sun, ShoppingCart, Menu } from 'lucide-react';
import { useThemeStore } from '../../store/theme';
import { useCartStore } from '../../store/cart';
import { useAuthStore } from '../../store/auth';
import CheckoutModal from '../orders/CheckoutModal';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useThemeStore();
  const { getTotalItems } = useCartStore();
  const { hasRole } = useAuthStore();
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  
  const totalItems = getTotalItems();

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 w-full px-4 md:px-6 py-4 sticky top-0 z-20"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="p-2 md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="relative hidden sm:block max-w-xs md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {hasRole('retail_customer') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCheckoutOpen(true)}
              className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </motion.button>
          )}

          <AnimatePresence>
            {isCheckoutOpen && (
              <CheckoutModal 
                isOpen={isCheckoutOpen} 
                onClose={() => setIsCheckoutOpen(false)} 
              />
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors hidden xs:block"
          >
            <Bell className="w-6 h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>
      
      {/* Mobile Search - Only visible on smallest screens */}
      <div className="mt-3 sm:hidden">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm"
          />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;