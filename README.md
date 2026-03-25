# IslandLink Sales Distribution Network (ISDN) System

A comprehensive, production-ready web application for managing wholesale and retail distribution operations across multiple regional distribution centers.

## 🚀 Features

### Core Functionality
- **Multi-Role Authentication**: Support for Retail Customers, RDC Staff, Logistics Teams, and Head Office Admins
- **Product Catalog**: Comprehensive product management with search, filtering, and categorization
- **Order Management**: Complete order lifecycle from placement to delivery
- **Real-time Inventory**: Multi-location inventory tracking with automatic synchronization
- **Delivery Tracking**: GPS-enabled delivery tracking with route optimization
- **Payment Processing**: Integrated Stripe payments with invoice generation
- **Analytics Dashboard**: Comprehensive business intelligence and reporting

### Technical Features
- **Modern Tech Stack**: React 18, TypeScript, Firebase, Tailwind CSS
- **Real-time Updates**: Firestore-powered live data synchronization
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark/Light Mode**: Complete theme switching capability
- **Progressive Web App**: Offline-capable with service workers
- **Role-based Access Control**: Secure, granular permission system

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Firestore, Auth, Functions, Hosting)
- **Styling**: Tailwind CSS + Framer Motion
- **State Management**: Zustand
- **Charts**: Recharts
- **Payments**: Stripe
- **Maps**: Google Maps API
- **Forms**: React Hook Form + Yup validation

## 🏗 Architecture

The system follows a clean 3-tier architecture:

1. **Presentation Layer** - React components with responsive design
2. **Application Layer** - Firebase Functions for business logic
3. **Data Layer** - Firestore NoSQL database

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Fill in your Firebase, Stripe, and Google Maps credentials
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔧 Firebase Setup

1. Create a new Firebase project
2. Enable Authentication (Email/Password)
3. Set up Firestore database
4. Configure security rules
5. Deploy Firebase Functions (if using)

### Firestore Collections Structure

```
users/
  - id, email, name, role, rdcId, phone, address, createdAt

products/
  - id, name, description, category, price, imageUrl, sku, unit, createdAt, updatedAt

orders/
  - id, customerId, rdcId, items[], totalAmount, status, deliveryAddress, estimatedDelivery, createdAt

inventory/
  - id, productId, rdcId, currentStock, reorderLevel, lastUpdated, movements[]

deliveries/
  - id, orderId, driverId, vehicleId, status, scheduledDate, route[], currentLocation

payments/
  - id, orderId, amount, status, method, stripePaymentId, createdAt

rdcs/
  - id, name, address, location, manager, phone, email, isActive
```

## 👥 User Roles

### 1. Retail Customer
- Browse product catalog
- Place and track orders
- View order history
- Make payments
- Manage profile

### 2. RDC Staff
- Manage local inventory
- Process customer orders
- Update stock levels
- Handle inter-branch transfers

### 3. Logistics Team
- Manage deliveries
- Track shipments
- Optimize routes
- Update delivery status

### 4. Head Office Admin
- Full system access
- Analytics and reporting
- User management
- System configuration

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray scale

### Typography
- **Headings**: Inter, 120% line-height
- **Body**: Inter, 150% line-height
- **Code**: JetBrains Mono

### Spacing
- Base unit: 8px
- Consistent spacing scale: 4px, 8px, 16px, 24px, 32px, 48px, 64px

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔐 Security Features

- Firebase Authentication with email/password
- Role-based access control (RBAC)
- Firestore security rules
- Input validation and sanitization
- HTTPS-only communication

## 🧪 Testing

Run the test suite:
```bash
npm test
```

### Test Coverage
- Unit tests for components
- Integration tests for user flows
- E2E tests for critical paths

## 📈 Performance

- Lazy loading for routes
- Image optimization
- Bundle splitting
- Service worker caching
- Database query optimization

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Firebase Deployment
```bash
firebase deploy
```

## 📊 Analytics & Monitoring

- Firebase Analytics integration
- Error tracking and reporting
- Performance monitoring
- User behavior analysis

## 🎯 Demo Accounts

For testing purposes, use these demo credentials:

- **Customer**: customer@demo.com / demo123
- **Admin**: admin@demo.com / demo123

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.