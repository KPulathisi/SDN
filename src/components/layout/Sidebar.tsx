import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  Package,
  Truck,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout, hasRole } = useAuthStore();
  const [isDesktop, setIsDesktop] = React.useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/', roles: ['retail_customer', 'rdc_staff', 'logistics', 'head_office'] },
    { icon: ShoppingBag, label: 'Products', path: '/products', roles: ['retail_customer', 'rdc_staff', 'head_office'] },
    { icon: Package, label: 'Orders', path: '/orders', roles: ['retail_customer', 'rdc_staff', 'logistics', 'head_office'] },
    { icon: Package, label: 'Inventory', path: '/inventory', roles: ['rdc_staff', 'head_office'] },
    { icon: Truck, label: 'Deliveries', path: '/deliveries', roles: ['logistics', 'head_office'] },
    { icon: CreditCard, label: 'Payments', path: '/payments', roles: ['retail_customer', 'head_office', 'rdc_staff'] },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['head_office'] },
    { icon: Users, label: 'Users', path: '/users', roles: ['head_office'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['retail_customer', 'rdc_staff', 'logistics', 'head_office'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    hasRole(item.roles as any)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ 
          x: isDesktop ? 0 : (isOpen ? 0 : -256),
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className={`w-64 bg-white dark:bg-gray-800 shadow-lg h-screen fixed md:sticky left-0 top-0 z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              IslandLink SDN
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[150px]">
              {user?.name}
            </p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-6 flex-1 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => !isDesktop && setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${
                  isActive ? 'bg-blue-100 dark:bg-gray-700 border-r-2 border-blue-500' : ''
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-64 p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;