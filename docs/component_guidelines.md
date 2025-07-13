# Component Guidelines - Badminton Cost Sharing App

**Version**: 1.0  
**Last Updated**: 2025-07-13  
**Framework**: React 19 + Next.js 15 + Tailwind CSS v4  
**Design System**: Mobile-First Financial Application

---

## 📋 Table of Contents

1. [Component Architecture](#component-architecture)
2. [Mobile-First Design Principles](#mobile-first-design-principles)
3. [Financial UI Components](#financial-ui-components)
4. [Form Components](#form-components)
5. [Navigation & Layout](#navigation--layout)
6. [Data Display Components](#data-display-components)
7. [Accessibility Standards](#accessibility-standards)
8. [Performance Guidelines](#performance-guidelines)
9. [Component Library](#component-library)
10. [Testing Components](#testing-components)

---

## 🏗️ Component Architecture

### Component Hierarchy
```
App Layout
├── Navigation (Mobile/Desktop)
├── Page Layouts
│   ├── Dashboard Layout
│   ├── Session Layout
│   └── Auth Layout
└── Shared Components
    ├── UI Components (buttons, inputs, cards)
    ├── Business Components (session, payment, player)
    └── Utility Components (loading, error, modal)
```

### Component Types
```typescript
// 1. UI Components - Pure presentational
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  onClick?: () => void;
}

// 2. Business Components - Domain-specific logic
interface SessionCardProps {
  session: Session;
  userRole: 'organizer' | 'player';
  onEdit?: (session: Session) => void;
}

// 3. Layout Components - Structure and positioning
interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

// 4. Compound Components - Complex interactions
interface SessionFormProps {
  initialData?: Partial<SessionFormData>;
  onSubmit: (data: SessionFormData) => Promise<void>;
  onCancel?: () => void;
}
```

### File Organization
```
src/components/
├── ui/                    # Pure UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   ├── Input/
│   └── Card/
├── business/              # Domain-specific components
│   ├── Session/
│   │   ├── SessionCard.tsx
│   │   ├── SessionForm.tsx
│   │   └── SessionList.tsx
│   ├── Payment/
│   └── Player/
├── layout/               # Layout components
│   ├── Header.tsx
│   ├── Navigation.tsx
│   ├── PageLayout.tsx
│   └── DashboardLayout.tsx
└── providers/            # Context providers
    ├── AuthProvider.tsx
    ├── ThemeProvider.tsx
    └── ToastProvider.tsx
```

---

## 📱 Mobile-First Design Principles

### Touch Target Standards
```typescript
// Touch target size constants
export const TOUCH_TARGETS = {
  MINIMUM: '44px',      // iOS/Android minimum
  COMFORTABLE: '48px',  // Recommended size
  LARGE: '56px',        // For primary actions
  SMALL: '40px',        // Only for secondary actions
} as const;

// Implementation in Button component
const Button: React.FC<ButtonProps> = ({ size = 'medium', ...props }) => {
  const sizeClasses = {
    small: 'min-h-[40px] px-3 text-sm',
    medium: 'min-h-[48px] px-4 text-base',
    large: 'min-h-[56px] px-6 text-lg',
  };
  
  return (
    <button
      className={`
        ${sizeClasses[size]}
        rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      {...props}
    />
  );
};
```

### Responsive Breakpoints
```typescript
// Tailwind breakpoint system
export const BREAKPOINTS = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Small desktops
  xl: '1280px',  // Large desktops
  '2xl': '1536px', // Extra large screens
} as const;

// Mobile-first responsive patterns
const ResponsiveGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="
      grid grid-cols-1 gap-4
      sm:grid-cols-2 sm:gap-6
      lg:grid-cols-3 lg:gap-8
    ">
      {children}
    </div>
  );
};

// Container with mobile-first approach
const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="
      w-full px-4 mx-auto
      sm:px-6 sm:max-w-2xl
      md:px-8 md:max-w-4xl
      lg:px-12 lg:max-w-6xl
      xl:px-16 xl:max-w-7xl
    ">
      {children}
    </div>
  );
};
```

### Mobile Navigation Patterns
```typescript
// Mobile-first navigation
const MobileNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 rounded-md"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        <MenuIcon className="w-6 h-6" />
      </button>
      
      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="
          fixed inset-0 z-50 bg-black bg-opacity-50
          md:hidden
        ">
          <div className="
            fixed inset-y-0 left-0 w-64 bg-white shadow-lg
            transform transition-transform duration-300
          ">
            <nav className="p-4 space-y-2">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/sessions">Sessions</NavLink>
              <NavLink href="/payments">Payments</NavLink>
              <NavLink href="/players">Players</NavLink>
            </nav>
          </div>
        </div>
      )}
      
      {/* Desktop navigation */}
      <nav className="hidden md:flex space-x-6">
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/sessions">Sessions</NavLink>
        <NavLink href="/payments">Payments</NavLink>
        <NavLink href="/players">Players</NavLink>
      </nav>
    </>
  );
};

const NavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`
        block px-3 py-2 rounded-md text-base font-medium
        transition-colors duration-200
        ${isActive 
          ? 'bg-blue-100 text-blue-900' 
          : 'text-gray-700 hover:bg-gray-100'
        }
      `}
    >
      {children}
    </Link>
  );
};
```

---

## 💰 Financial UI Components

### Money Display Component
```typescript
interface MoneyDisplayProps {
  amount: number;
  currency?: 'SGD';
  size?: 'small' | 'medium' | 'large';
  variant?: 'positive' | 'negative' | 'neutral';
  showSign?: boolean;
}

const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amount,
  currency = 'SGD',
  size = 'medium',
  variant = 'neutral',
  showSign = false,
}) => {
  const formatAmount = (value: number): string => {
    const formatted = Math.abs(value).toFixed(2);
    return `$${formatted}`;
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-900';
    }
  };
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-xl font-semibold';
      default:
        return 'text-base font-medium';
    }
  };
  
  const sign = amount < 0 ? '-' : (showSign && amount > 0 ? '+' : '');
  
  return (
    <span 
      className={`font-mono ${getSizeStyles()} ${getVariantStyles()}`}
      data-testid="money-display"
    >
      {sign}{formatAmount(amount)}
    </span>
  );
};

// Usage examples
<MoneyDisplay amount={-25.50} variant="negative" showSign />  // -$25.50
<MoneyDisplay amount={15.75} variant="positive" showSign />   // +$15.75
<MoneyDisplay amount={100.00} size="large" />                // $100.00
```

### Balance Card Component
```typescript
interface BalanceCardProps {
  playerName: string;
  currentBalance: number;
  lastActivity: string;
  onClick?: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  playerName,
  currentBalance,
  lastActivity,
  onClick,
}) => {
  const isDebt = currentBalance < 0;
  const isCredit = currentBalance > 0;
  
  return (
    <div
      className={`
        p-4 rounded-lg border-2 transition-all duration-200
        ${isDebt ? 'border-red-200 bg-red-50' : 
          isCredit ? 'border-green-200 bg-green-50' : 
          'border-gray-200 bg-white'}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{playerName}</h3>
          <p className="text-sm text-gray-600">Last: {lastActivity}</p>
        </div>
        
        <div className="text-right">
          <MoneyDisplay
            amount={currentBalance}
            variant={isDebt ? 'negative' : isCredit ? 'positive' : 'neutral'}
            size="large"
            showSign
          />
          {isDebt && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
              ⚠️ Owes
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Session Cost Breakdown Component
```typescript
interface SessionCostBreakdownProps {
  hoursPlayed: number;
  shuttlecocksUsed: number;
  courtRate: number;
  shuttlecockRate: number;
  attendeeCount: number;
  showDetailed?: boolean;
}

const SessionCostBreakdown: React.FC<SessionCostBreakdownProps> = ({
  hoursPlayed,
  shuttlecocksUsed,
  courtRate,
  shuttlecockRate,
  attendeeCount,
  showDetailed = false,
}) => {
  const courtCost = hoursPlayed * courtRate;
  const shuttlecockCost = shuttlecocksUsed * shuttlecockRate;
  const totalCost = courtCost + shuttlecockCost;
  const costPerPlayer = totalCost / attendeeCount;
  
  if (!showDetailed) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Cost per player:</span>
          <MoneyDisplay amount={costPerPlayer} size="large" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
      <h4 className="font-semibold text-gray-900">Cost Breakdown</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Court ({hoursPlayed}h × ${courtRate}/h):</span>
          <MoneyDisplay amount={courtCost} />
        </div>
        
        <div className="flex justify-between">
          <span>Shuttlecocks ({shuttlecocksUsed} × ${shuttlecockRate}):</span>
          <MoneyDisplay amount={shuttlecockCost} />
        </div>
        
        <hr className="border-gray-300" />
        
        <div className="flex justify-between font-medium">
          <span>Total Cost:</span>
          <MoneyDisplay amount={totalCost} />
        </div>
        
        <div className="flex justify-between font-semibold text-blue-900">
          <span>Per Player ({attendeeCount} players):</span>
          <MoneyDisplay amount={costPerPlayer} size="large" />
        </div>
      </div>
    </div>
  );
};
```

---

## 📝 Form Components

### Secure Money Input Component
```typescript
interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  required?: boolean;
  max?: number;
  disabled?: boolean;
}

const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  label,
  error,
  required = false,
  max = 1000,
  disabled = false,
}) => {
  const [focused, setFocused] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Remove any non-numeric characters except decimal point
    const cleanValue = rawValue.replace(/[^\d.]/g, '');
    
    // Validate decimal format
    const decimalParts = cleanValue.split('.');
    if (decimalParts.length > 2) return; // Multiple decimal points
    
    // Limit to 2 decimal places
    if (decimalParts[1] && decimalParts[1].length > 2) return;
    
    onChange(cleanValue);
  };
  
  const handleBlur = () => {
    setFocused(false);
    
    // Format the value on blur
    if (value && !isNaN(parseFloat(value))) {
      const formatted = parseFloat(value).toFixed(2);
      onChange(formatted);
    }
  };
  
  return (
    <div className="space-y-1">
      <label 
        htmlFor={`money-input-${label}`}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 font-medium">$</span>
        </div>
        
        <input
          id={`money-input-${label}`}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          className={`
            block w-full pl-8 pr-3 py-3 rounded-lg border text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${error 
              ? 'border-red-300 text-red-900 placeholder-red-300' 
              : 'border-gray-300 text-gray-900'
            }
          `}
          placeholder="0.00"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${label}-error` : undefined}
        />
      </div>
      
      {error && (
        <p 
          id={`${label}-error`}
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {value && parseFloat(value) > max && (
        <p className="text-sm text-amber-600">
          ⚠️ Amount exceeds maximum of ${max}
        </p>
      )}
    </div>
  );
};
```

### Session Form Component
```typescript
interface SessionFormProps {
  initialData?: Partial<SessionFormData>;
  onSubmit: (data: SessionFormData) => Promise<void>;
  onCancel?: () => void;
  mode: 'create' | 'complete' | 'edit';
}

const SessionForm: React.FC<SessionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  mode,
}) => {
  const [formData, setFormData] = useState<SessionFormData>({
    date: initialData?.date || '',
    start_time: initialData?.start_time || '',
    location: initialData?.location || '',
    hours_played: initialData?.hours_played,
    shuttlecocks_used: initialData?.shuttlecocks_used,
    attendees: initialData?.attendees || [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (new Date(formData.date) < new Date()) {
      newErrors.date = 'Date cannot be in the past';
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (mode === 'complete') {
      if (!formData.hours_played || formData.hours_played <= 0) {
        newErrors.hours_played = 'Hours played must be greater than 0';
      }
      
      if (formData.shuttlecocks_used === undefined || formData.shuttlecocks_used < 0) {
        newErrors.shuttlecocks_used = 'Shuttlecocks used cannot be negative';
      }
      
      if (formData.attendees.length === 0) {
        newErrors.attendees = 'At least one attendee is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic session details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Time *
          </label>
          <input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.start_time && (
            <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Location *
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., Sports Hub Court 1"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location}</p>
        )}
      </div>
      
      {/* Session completion details */}
      {mode === 'complete' && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hours Played *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="8"
                value={formData.hours_played || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  hours_played: parseFloat(e.target.value) || undefined 
                })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.hours_played && (
                <p className="mt-1 text-sm text-red-600">{errors.hours_played}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Shuttlecocks Used *
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.shuttlecocks_used || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  shuttlecocks_used: parseInt(e.target.value) || undefined 
                })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.shuttlecocks_used && (
                <p className="mt-1 text-sm text-red-600">{errors.shuttlecocks_used}</p>
              )}
            </div>
          </div>
          
          <AttendeeSelector
            attendees={formData.attendees}
            onChange={(attendees) => setFormData({ ...formData, attendees })}
            error={errors.attendees}
          />
        </>
      )}
      
      {/* Form actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : (
            mode === 'create' ? 'Create Session' :
            mode === 'complete' ? 'Complete Session' :
            'Update Session'
          )}
        </button>
      </div>
    </form>
  );
};
```

---

## 🧭 Navigation & Layout

### Page Layout Component
```typescript
interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  children,
  actions,
  breadcrumbs,
  maxWidth = 'lg',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none',
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`mx-auto px-4 py-6 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]}`}>
        {/* Breadcrumbs */}
        {breadcrumbs && (
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((item, index) => (
                <li key={item.href || item.label} className="flex items-center">
                  {index > 0 && (
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-2" />
                  )}
                  {item.href ? (
                    <Link 
                      href={item.href}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-600">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        
        {/* Page header */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {title}
            </h1>
          </div>
          
          {actions && (
            <div className="flex flex-col gap-2 sm:flex-row">
              {actions}
            </div>
          )}
        </div>
        
        {/* Page content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};
```

### Dashboard Layout with Role-Based Navigation
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'organizer' | 'player';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userRole }) => {
  const organizerNavItems = [
    { href: '/dashboard', label: 'Overview', icon: HomeIcon },
    { href: '/sessions', label: 'Sessions', icon: CalendarIcon },
    { href: '/payments', label: 'Payments', icon: CreditCardIcon },
    { href: '/players', label: 'Players', icon: UsersIcon },
    { href: '/analytics', label: 'Analytics', icon: ChartBarIcon },
    { href: '/settings', label: 'Settings', icon: CogIcon },
  ];
  
  const playerNavItems = [
    { href: '/dashboard', label: 'My Dashboard', icon: HomeIcon },
    { href: '/sessions', label: 'Sessions', icon: CalendarIcon },
    { href: '/history', label: 'My History', icon: ClockIcon },
    { href: '/profile', label: 'Profile', icon: UserIcon },
  ];
  
  const navItems = userRole === 'organizer' ? organizerNavItems : playerNavItems;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">
              🏸 Badminton Tracker
            </h1>
            <UserMenu />
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-shrink-0">
          <div className="w-64 bg-white shadow-sm border-r border-gray-200">
            <div className="p-6">
              <h1 className="text-xl font-bold text-gray-900">
                🏸 Badminton Tracker
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {userRole === 'organizer' ? 'Organizer Portal' : 'Player Portal'}
              </p>
            </div>
            
            <nav className="px-3 pb-6">
              {navItems.map((item) => (
                <NavItem 
                  key={item.href} 
                  href={item.href} 
                  icon={item.icon}
                >
                  {item.label}
                </NavItem>
              ))}
            </nav>
            
            <div className="absolute bottom-0 w-64 p-3 border-t border-gray-200">
              <UserMenu />
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 py-2">
          {navItems.slice(0, 4).map((item) => (
            <MobileNavItem 
              key={item.href} 
              href={item.href} 
              icon={item.icon}
            >
              {item.label}
            </MobileNavItem>
          ))}
        </div>
      </nav>
    </div>
  );
};
```

This comprehensive component guidelines document provides a solid foundation for building consistent, accessible, and maintainable UI components for your badminton cost-sharing app, with special focus on mobile-first design and financial data handling.