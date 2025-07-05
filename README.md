# 🚚 Supply Chain Management System

A comprehensive, modern supply chain management solution built for hackathons and real-world applications. This system provides end-to-end visibility and control over inventory management, order processing, last-mile delivery optimization, and supply chain analytics.

## 🎯 **Project Overview**

This is a full-stack application featuring:

### **Backend (Node.js + TypeScript + PostgreSQL)**

- **Express.js** REST API with TypeScript
- **PostgreSQL** database with Prisma ORM
- **Socket.IO** for real-time updates
- **JWT Cookie-based authentication**
- **Comprehensive API endpoints** for all supply chain operations

### **Frontend (React + TypeScript + Tailwind CSS)**

- **React 19** with TypeScript
- **Tailwind CSS** for modern, responsive UI
- **Chart.js & Recharts** for data visualization
- **Zustand** for state management
- **Real-time updates** via Socket.IO
- **Role-based dashboard** interfaces

## 🌟 **Core Features**

### 📦 **Inventory Management**

- Real-time inventory tracking across multiple locations
- Automated low-stock alerts and reordering points
- Stock adjustment with audit trails
- Multi-location inventory visibility
- Product categorization and supplier tracking

### 📋 **Order Management**

- Purchase orders, sales orders, and transfers
- Order status tracking and fulfillment
- Automated inventory reservation
- Priority-based order processing
- Order analytics and reporting

### 🚛 **Last-Mile Delivery Optimization**

- AI-powered route planning and optimization
- Driver assignment and tracking
- Real-time delivery status updates
- Delivery performance analytics
- Cost optimization algorithms

### 📊 **Supply Chain Analytics**

- Real-time KPI dashboards
- Performance benchmarking
- Inventory turnover analysis
- Supplier performance tracking
- Financial metrics and trends

### 🏢 **Multi-Location Support**

- Warehouse, store, and distribution center management
- Location-based inventory tracking
- Proximity-based optimization
- City-wise performance analysis

## 🛠 **Technology Stack**

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with httpOnly cookies
- **Real-time**: Socket.IO
- **Validation**: Zod
- **Security**: Helmet, CORS, bcrypt

### Frontend

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Charts**: Chart.js + React-Chartjs-2, Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Forms**: React Hook Form

## 🚀 **Getting Started**

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v13 or higher)
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HackathonWalmart
```

### 2. Backend Setup

```bash
cd Backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/supply_chain_db"
# JWT_SECRET="your-super-secret-jwt-key-here"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Optional: Seed database with sample data
npx prisma db seed

# Start development server
npm run dev
```

The backend will be running on **http://localhost:3001**

### 3. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be running on **http://localhost:5173**

## 📊 **Database Schema**

The system uses a comprehensive PostgreSQL schema with the following key entities:

- **Users**: Authentication and role management
- **Locations**: Warehouses, stores, distribution centers
- **Suppliers**: Vendor management and performance tracking
- **Products & Categories**: Product catalog with categorization
- **Inventory**: Multi-location stock tracking
- **Orders & Order Items**: Purchase/sales order management
- **Deliveries**: Last-mile delivery tracking
- **Analytics**: Performance metrics and KPIs

## 🎨 **UI Components & Features**

### Dashboard

- **Real-time metrics** overview
- **Interactive charts** and graphs
- **Low stock alerts**
- **Recent activity** feed

### Inventory Management

- **Stock level** tracking
- **Multi-location** inventory view
- **Adjustment** capabilities
- **Reorder point** management

### Order Processing

- **Order creation** and editing
- **Status tracking**
- **Fulfillment** workflow
- **Order analytics**

### Delivery Optimization

- **Route planning**
- **Driver assignment**
- **Real-time tracking**
- **Performance metrics**

## 🔧 **API Documentation**

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Inventory Endpoints

- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory
- `POST /api/inventory/:id/adjust` - Adjust stock levels

### Orders Endpoints

- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `POST /api/orders/:id/fulfill` - Fulfill order
- `POST /api/orders/:id/cancel` - Cancel order

### Delivery Endpoints

- `GET /api/delivery` - Get all deliveries
- `POST /api/delivery/optimize-route` - Optimize delivery routes
- `POST /api/delivery/:id/assign-driver` - Assign driver

### Analytics Endpoints

- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/kpis` - Key performance indicators
- `GET /api/analytics/trends` - Performance trends

## 📱 **Real-time Features**

The system includes real-time updates using Socket.IO:

- **Inventory changes** broadcast to relevant users
- **Order status updates** in real-time
- **Delivery tracking** with live location updates
- **Low stock alerts** pushed to warehouse managers
- **Performance metrics** updated live on dashboards

## 🔐 **Security Features**

- **JWT authentication** with httpOnly cookies
- **Role-based access control** (Admin, Manager, Employee, Driver)
- **Input validation** with Zod schemas
- **CORS protection**
- **Helmet** security headers
- **Password hashing** with bcrypt

## 🎯 **Hackathon-Ready Features**

This system is specifically designed for hackathon demonstrations:

1. **Quick Setup**: Complete environment in under 10 minutes
2. **Demo Data**: Pre-configured sample data for presentations
3. **Real-time Demos**: Live updates perfect for audience engagement
4. **Modern UI**: Beautiful, professional interface
5. **Comprehensive Features**: End-to-end supply chain coverage
6. **Scalable Architecture**: Production-ready design patterns

## 🚀 **Deployment**

### Production Build

**Backend:**

```bash
cd Backend
npm run build
npm start
```

**Frontend:**

```bash
cd Frontend
npm run build
npm run preview
```

### Environment Variables

**Backend (.env):**

```
DATABASE_URL="postgresql://username:password@localhost:5432/supply_chain_db"
JWT_SECRET="your-production-jwt-secret"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="production"
CORS_ORIGIN="https://your-frontend-domain.com"
```

**Frontend (.env):**

```
VITE_API_URL=https://your-api-domain.com/api
```

## 🚀 **UPDATES**

### 🌟 **Immediate Priorities (Next 1-2 Weeks)**

- **Frontend UI Implementation (80% Remaining)**: Complete all pages and components based on the existing architecture.
- **Real-time Charting**: Integrate real-time data feeds into all analytics dashboards.
- **End-to-End Testing**: Write comprehensive E2E tests for critical user flows.
- **CI/CD Pipeline**: Set up a full CI/CD pipeline using GitHub Actions for automated testing and deployment.

### ✨ **Key Improvements (Next 1-3 Months)**

- **AI-Powered Demand Forecasting**: Integrate machine learning models to predict future demand based on historical data.
- **Supplier Portal**: Develop a dedicated portal for suppliers to manage their products, view orders, and track performance.
- **Advanced Analytics**: Introduce more sophisticated analytics, including cohort analysis, anomaly detection, and predictive insights.
- **Mobile Application**: Create a lightweight mobile app for drivers and warehouse staff for on-the-go operations.

### ☁️ **Long-Term Vision (Next 6-12 Months)**

- **Multi-Tenant Architecture**: Refactor the system to support multiple organizations on a single instance.
- **Blockchain for Traceability**: Implement a blockchain ledger for immutable tracking of goods from origin to consumer.
- **IoT Integration**: Integrate with IoT sensors for real-time monitoring of warehouse conditions and shipment tracking.
- **Sustainability Dashboard**: Add a dashboard to track and report on the environmental impact of the supply chain.
