# Badminton Cost Sharing App

🏢 **ENTERPRISE-READY** web application for managing badminton session costs and player payments, designed for Singapore badminton groups with premium UI/UX and data management capabilities.

## 🏸 Overview

**Problem**: Managing badminton session costs and player payments using Access DB + Excel is cumbersome and requires PC access.

**Solution**: Enterprise-grade mobile-first web app with real-time cost calculation, session planning, payment tracking, and comprehensive data management accessible from any device.

**Business Model**: Running tab system - players can play with debt, settle payments as convenient via PayNow.

## ✨ Enterprise Features

### 🎯 Core Functionality (Complete)
- **Session Planning**: Plan sessions 2 weeks in advance with date/time/location
- **Usage-Based Costing**: Court rate × hours + shuttlecock rate × quantity 
- **Session Conversion**: Convert planned sessions to completed with auto-selected participants
- **Payment Tracking**: Record PayNow/cash payments with balance updates
- **Dual Dashboards**: Organizer management view + player personal view
- **Financial Precision**: 1 decimal place rounding across all calculations

### 🏢 Enterprise Data Management (New)
- **Data Export System**: Complete organizer data backup to JSON format
- **Data Import System**: Data restoration with validation and conflict resolution
- **Settings Integration**: Enterprise tools integrated into settings page
- **Progress Tracking**: Real-time export/import progress with error handling

### 🎨 Premium UI/UX Design System (v2.0)
- **Glassmorphism Effects**: Multi-layer backgrounds with backdrop blur
- **Deep Shadows**: Premium depth with hardware acceleration
- **Color Harmony**: Purple-to-green gradients with status-based themes
- **Financial Enhancement**: Correct color logic (negative=green, positive=red)
- **Touch Optimization**: 44px+ targets across all interactions

### 🔐 Authentication & Security
- Singapore phone number (+65) with OTP verification
- Role-based access (Organizer vs Player)
- Public phone check system with database view
- Secure data export/import with validation

### 📱 Mobile-First Enterprise Design
- Touch-friendly 44px+ targets optimized for mobile use
- Premium glassmorphism UI across all 11 screens
- PayNow integration ready for Singapore market
- Responsive design with hardware acceleration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd badminton-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
# Configure your Supabase credentials
```

4. **Run development server**
```bash
npm run dev
```

5. **Open in browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Development Login
Use any Singapore phone number (+65 XXXX XXXX) with OTP code `123456` for testing.

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **UI**: Tailwind CSS v4 + TypeScript
- **Database**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth (Phone + OTP)
- **Calculations**: Decimal.js for financial precision
- **Deployment**: Vercel-ready

### Project Structure
```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication screens
│   ├── (dashboard)/       # Main app screens
│   └── globals.css        # Global styles & design tokens
├── components/
│   ├── ui/                # Reusable UI components
│   ├── business/          # Domain-specific components
│   └── providers/         # React context providers
├── lib/
│   ├── calculations/      # Financial calculation engine
│   ├── supabase/         # Database client & types
│   └── utils/            # Shared utilities
└── docs/                  # Comprehensive documentation
```

## 📋 Current Status

**Overall Progress**: 🏢 **ENTERPRISE-READY** - 100% Complete
- ✅ **Phase 1**: Authentication & Foundation
- ✅ **Phase 2**: Core User Experiences  
- ✅ **Phase 2.5**: Session Planning (Epic 5)
- ✅ **Phase 3**: Player Management & History
- ✅ **Phase 4**: Database Integration & Service Layer
- ✅ **Phase 5**: Role-Based Access Control & MVP
- ✅ **Phase 6**: Premium UI/UX Modernization
- ✅ **Phase 7**: Enterprise Data Management & Advanced Features

### Enterprise Features Complete
- **Organizer**: Dashboard, Record Session, Record Payment, Plan Session, Session Management, Player Management, Data Export/Import
- **Player**: Dashboard, Balance View, Session History, Upcoming Sessions with Premium UI
- **System**: Authentication, Financial Calculations, Session Planning, Data Management, Premium Design System
- **Data**: Complete export/import system, financial precision, session conversion automation

### Production Ready Features
- 11 screens with premium glassmorphism UI
- Complete role-based access control
- Enterprise data management system
- Financial precision with 1 decimal place rounding
- Session conversion with auto-participant selection
- Comprehensive documentation and lessons learned

## 🧪 Testing

### Authentication Testing
```bash
# Login with any Singapore number
Phone: +65 9123 4567
OTP: 123456 (development mode)
```

### Financial Testing
The app includes comprehensive tests for:
- Money calculations (21 test cases)
- Session cost calculations
- Usage-based cost breakdown
- Balance updates

```bash
npm run test
```

## 📖 Documentation

Comprehensive documentation available in `/docs/`:
- **Requirements**: `docs/plans/badminton_requirements.md`
- **Implementation Status**: `docs/implementation_status.md`
- **API Design**: `docs/plans/api_endpoints.md`
- **Database Schema**: `docs/plans/database_schema.md`
- **Security Guide**: `docs/security_standards.md`

## 🔒 Security

- Row Level Security (RLS) policies
- OWASP compliance for financial data
- Phone-based authentication
- Audit trails for all financial operations

## 📱 Singapore Features

- Singapore dollar (SGD) currency formatting
- +65 phone number validation
- PayNow payment method integration
- Local date/time formatting

## 🚀 Deployment

Ready for deployment on Vercel:

```bash
npm run build
npm run start
```

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🤝 Contributing

1. Check implementation status in `docs/implementation_status.md`
2. Follow coding standards in `docs/coding_standards.md`
3. Test financial calculations thoroughly
4. Ensure mobile-first responsive design

## 📄 License

Private project for badminton cost sharing management.
