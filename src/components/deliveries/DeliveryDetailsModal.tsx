import React from 'react';
import { motion } from 'framer-motion';
import { X, Truck, Phone, MapPin, Navigation, User } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Delivery, Order, User as UserType } from '../../types';
import Button from '../ui/Button';

// Fix Leaflet icon issue in Vite/React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const truckIcon = L.divIcon({
  html: `<div class="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg text-white">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3m0 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0m10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M17 17h2v-5l-5-5H2"/></svg>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  order?: Order | null;
  driver?: UserType | null;
}

const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({ isOpen, onClose, delivery, order, driver }) => {
  if (!isOpen || !delivery) return null;

  const defaultCenter: [number, number] = [7.8731, 80.7718]; // Center of Sri Lanka
  const currentLocation: [number, number] = delivery.currentLocation ? [delivery.currentLocation.lat, delivery.currentLocation.lng] : defaultCenter;
  
  const polylinePoints: [number, number][] = delivery.route.map(p => [p.lat, p.lng]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] overflow-hidden flex flex-col md:flex-row"
      >
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-[300px]">
          <MapContainer center={currentLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {delivery.currentLocation && (
              <Marker position={currentLocation} icon={truckIcon}>
                <Popup>
                  <div className="text-center font-bold">Driver: {driver?.name || 'Assigned Driver'}</div>
                </Popup>
              </Marker>
            )}
            {polylinePoints.length > 0 && (
              <Polyline positions={polylinePoints} color="#3b82f6" weight={4} opacity={0.7} dashArray="10, 10" />
            )}
            {order?.deliveryAddress && (
               <Marker position={defaultCenter}> {/* In real app, geocode address */}
                  <Popup>Destination: {order.deliveryAddress}</Popup>
               </Marker>
            )}
          </MapContainer>
          
          <button onClick={onClose} className="absolute top-4 right-4 z-[1000] p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="w-full md:w-80 p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                delivery.status === 'delivered' ? 'bg-green-100 text-green-700' :
                delivery.status === 'en_route' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {delivery.status.replace('_', ' ')}
              </span>
              <span className="text-xs font-mono text-gray-400">#{delivery.id.slice(-8).toUpperCase()}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delivery Tracking</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Vehicle Information</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{delivery.vehicleId}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Assigned Driver</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{driver?.name || 'Loading...'}</p>
                <button className="text-blue-600 text-xs flex items-center gap-1 mt-1 hover:underline">
                  <Phone className="w-3 h-3" /> {driver?.phone || 'No phone'}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Destination</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{order?.deliveryAddress}</p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">Estimated Arrival</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">35 mins</span>
             </div>
             <Button className="w-full" variant="outline">
                <Navigation className="w-4 h-4 mr-2" />
                Open in Google Maps
             </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeliveryDetailsModal;
