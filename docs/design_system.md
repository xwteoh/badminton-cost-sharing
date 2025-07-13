# Design System - Badminton Cost Sharing App

**Version**: 1.0  
**Last Updated**: 2025-07-13  
**Platform**: Mobile-First Web Application  
**Framework**: Next.js 15 + React 19 + Tailwind CSS v4  
**Target Market**: Singapore Badminton Players  
**Primary Use**: Cost Tracking and Payment Management

---

## 📋 Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Library](#component-library)
6. [Icons & Imagery](#icons--imagery)
7. [Motion & Animation](#motion--animation)
8. [Accessibility](#accessibility)
9. [Design Tokens](#design-tokens)
10. [Implementation Guidelines](#implementation-guidelines)

---

## 🎨 Design Principles

### Core Principles
1. **Mobile-First Clarity**: Optimize for small screens, enhance for larger ones
2. **Financial Transparency**: Clear money displays, explicit cost breakdowns
3. **Touch-Friendly**: All interactive elements 44px+ for easy mobile use
4. **Accessible by Default**: WCAG 2.1 AA compliance for all users
5. **Cultural Sensitivity**: Singapore-focused design and payment methods

### Design Philosophy
Simple, transparent, and trustworthy. The app should feel like a reliable financial tool that badminton players can depend on for accurate cost tracking. Every interaction should be clear and every financial calculation should be transparent.

### Brand Personality
- **Tone**: Trustworthy, Clear, Efficient, Friendly
- **Voice**: Straightforward and helpful, like a good organizer
- **Feel**: Clean, reliable, and optimized for busy athletes

---

## 🎨 Color System

### Primary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Primary | #2563EB | rgb(37, 99, 235) | Main CTA buttons, links, active states |
| Primary Light | #3B82F6 | rgb(59, 130, 246) | Hover states, light backgrounds |
| Primary Dark | #1D4ED8 | rgb(29, 78, 216) | Pressed states, emphasis |

### Secondary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Secondary | #64748B | rgb(100, 116, 139) | Secondary buttons, subtle elements |
| Accent | #F59E0B | rgb(245, 158, 11) | Highlights, notifications, badges |

### Semantic Colors
| Name | Hex | Light Mode | Dark Mode | Usage |
|------|-----|------------|-----------|-------|
| Success | #10B981 | #10B981 | #34D399 | Payment confirmations, session completion |
| Warning | #F59E0B | #F59E0B | #FBBF24 | Outstanding balances, payment reminders |
| Error | #EF4444 | #EF4444 | #F87171 | Validation errors, failed transactions |
| Info | #3B82F6 | #3B82F6 | #60A5FA | Tips, help text, neutral information |

### Neutral Colors
| Name | Hex | Usage |
|------|-----|-------|
| Background | #F8FAFC | Main app background, light and clean |
| Surface | #FFFFFF | Cards, forms, elevated content areas |
| Surface Secondary | #F1F5F9 | Secondary cards, subtle backgrounds |
| Border | #E2E8F0 | Input borders, card outlines, dividers |
| Border Focus | #3B82F6 | Focused input borders, active states |
| Text Primary | #0F172A | Main headings, important text |
| Text Secondary | #475569 | Body text, descriptions |
| Text Muted | #94A3B8 | Captions, placeholders, disabled text |
| Text Disabled | #CBD5E1 | Disabled form elements |

### Financial Colors (Special Purpose)
| Name | Hex | Usage |
|------|-----|-------|
| Money Positive | #059669 | Credit balances, payments received |
| Money Negative | #DC2626 | Debt balances, amounts owed |
| Money Neutral | #374151 | Zero balances, neutral amounts |
| Payment Pending | #D97706 | Pending payments, processing states |

### Color Usage Guidelines
- **Contrast Ratios**: Maintain WCAG AA standards (4.5:1 for normal text)
- **Color Blindness**: Test with simulators, never rely on color alone
- **Mobile Optimization**: High contrast for outdoor visibility
- **Singapore Context**: Consider cultural color associations

---

## 📝 Typography

### Type Scale
| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|---------|
| Display Large | 36px | 40px | 700 | Dashboard totals, major financial figures |
| Display Medium | 30px | 36px | 600 | Page headers, section titles |
| Heading 1 | 24px | 32px | 600 | Main page titles, form headers |
| Heading 2 | 20px | 28px | 600 | Section headers, card titles |
| Heading 3 | 18px | 24px | 500 | Subsection headers, component titles |
| Body Large | 16px | 24px | 400 | Important body text, form labels |
| Body Regular | 14px | 20px | 400 | Default body text, descriptions |
| Body Small | 12px | 16px | 400 | Captions, metadata, fine print |
| Money Display | 18px | 24px | 600 | Financial amounts, balances |
| Money Large | 24px | 32px | 700 | Important financial figures |

### Font Families
```css
/* Primary font for all text */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace for financial figures (better number alignment) */
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;

/* System fonts for better mobile performance */
--font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Financial Typography Guidelines
- **Money Amounts**: Always use monospace font for proper alignment
- **Currency Symbols**: Include $ symbol with consistent spacing
- **Decimal Places**: Always show 2 decimal places for SGD amounts
- **Large Numbers**: Use space or comma separators for readability (S$1,234.56)

### Typography Guidelines
- **Hierarchy**: Clear visual hierarchy using size and weight
- **Readability**: Optimal line length 50-75 characters
- **Responsive**: Scale appropriately across devices
- **Mobile**: Ensure 16px+ for body text to prevent zoom on iOS

---

## 📐 Spacing & Layout

### Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| space-xs | 4px | Icon padding, tight inline spacing |
| space-sm | 8px | Small component padding, list item gaps |
| space-md | 16px | Default component padding, form field spacing |
| space-lg | 24px | Card padding, section spacing |
| space-xl | 32px | Page margins, major section breaks |
| space-2xl | 48px | Top-level page spacing |
| space-3xl | 64px | Major layout separation |

### Touch Target Spacing
| Token | Value | Usage |
|-------|-------|-------|
| touch-min | 44px | Minimum iOS/Android touch target |
| touch-comfortable | 48px | Recommended touch target size |
| touch-large | 56px | Primary action buttons |
| touch-spacing | 8px | Minimum spacing between touch targets |

### Grid System
- **Columns**: 12 columns (flexible grid)
- **Gutter**: 16px (mobile), 24px (tablet+)
- **Margin**: 16px (mobile), 24px (tablet), 32px (desktop)
- **Content**: Single column priority for mobile financial clarity

### Container Widths
| Breakpoint | Max Width | Usage |
|------------|-----------|-------|
| Mobile | 100% | Full width mobile experience |
| Tablet | 768px | Comfortable tablet reading |
| Desktop | 1024px | Focused desktop experience |
| Wide | 1280px | Maximum width for large screens |

### Mobile-First Layout Principles
- **Single Column**: Priority on mobile for financial clarity
- **Card-Based**: Individual cards for sessions, payments, players
- **Progressive Enhancement**: Add columns only on larger screens
- **Touch Navigation**: Bottom tab bar on mobile, sidebar on desktop

### Responsive Breakpoints
```css
/* Mobile-first approach */
--breakpoint-sm: 640px;  /* Small tablets, large phones */
--breakpoint-md: 768px;  /* Tablets */
--breakpoint-lg: 1024px; /* Small desktops, large tablets */
--breakpoint-xl: 1280px; /* Large desktops */
--breakpoint-2xl: 1536px; /* Extra large screens */

/* Touch-specific breakpoints */
--touch-device: 1024px; /* Assume touch below this */
```

### Singapore Mobile Considerations
- **Primary Target**: iPhone 12/13/14 (375px-414px width)
- **Secondary Target**: Android flagships (360px-414px width)
- **Network**: Optimize for slower 4G connections
- **Usage**: Portrait orientation primary, landscape secondary

---

## 🧩 Component Library

### Buttons
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}
```

#### Button Specifications
| Variant | Background | Text | Border | Min Height | Usage |
|---------|------------|------|--------|------------|-------|
| Primary | #2563EB | #FFFFFF | none | 48px | Record payment, complete session |
| Secondary | #F1F5F9 | #475569 | #E2E8F0 | 48px | Cancel, secondary actions |
| Ghost | transparent | #2563EB | none | 44px | Text links, subtle actions |
| Danger | #EF4444 | #FFFFFF | none | 48px | Delete, remove player |
| Success | #10B981 | #FFFFFF | none | 48px | Confirm payment, approve |

#### Touch Target Guidelines
- **Minimum Size**: 44px × 44px (iOS/Android standard)
- **Comfortable Size**: 48px × 48px (recommended)
- **Primary Actions**: 56px × 48px (extra prominence)
- **Spacing**: 8px minimum between adjacent buttons
- **Full Width**: Use on mobile for primary actions

### Form Elements

#### Input Fields
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time';
  state: 'default' | 'focus' | 'error' | 'disabled' | 'success';
  label?: string;
  helper?: string;
  error?: string;
  prefix?: string; // For currency symbols
  suffix?: string; // For units
  required?: boolean;
  placeholder?: string;
}
```

#### Financial Input Fields
```typescript
interface MoneyInputProps extends InputProps {
  currency: 'SGD';
  max?: number; // Maximum amount validation
  precision?: 2; // Decimal places (always 2 for SGD)
  showCurrency?: boolean; // Show $ symbol
}

interface PhoneInputProps extends InputProps {
  country: 'SG'; // Singapore phone format
  format: '+65 XXXX XXXX'; // Display format
  validate?: boolean; // Singapore number validation
}
```

#### Input Specifications
| State | Background | Border | Text | Height |
|-------|------------|--------|------|--------|
| Default | #FFFFFF | #E2E8F0 | #0F172A | 48px |
| Focus | #FFFFFF | #3B82F6 (2px) | #0F172A | 48px |
| Error | #FFFFFF | #EF4444 (2px) | #0F172A | 48px |
| Disabled | #F8FAFC | #E2E8F0 | #94A3B8 | 48px |
| Success | #FFFFFF | #10B981 (2px) | #0F172A | 48px |

### Cards
```typescript
interface CardProps {
  variant: 'elevated' | 'outlined' | 'filled';
  padding: 'none' | 'small' | 'medium' | 'large';
  interactive?: boolean;
  status?: 'default' | 'warning' | 'error' | 'success';
}
```

#### Financial Cards
```typescript
interface SessionCardProps extends CardProps {
  session: Session;
  showCost?: boolean;
  showStatus?: boolean;
  onEdit?: () => void;
  onComplete?: () => void;
}

interface BalanceCardProps extends CardProps {
  balance: number;
  playerName: string;
  lastActivity: Date;
  status: 'credit' | 'debt' | 'zero';
}

interface PaymentCardProps extends CardProps {
  payment: Payment;
  showMethod?: boolean;
  showDate?: boolean;
}
```

#### Card Specifications
| Variant | Background | Border | Shadow | Padding |
|---------|------------|--------|--------|---------|
| Elevated | #FFFFFF | none | 0 1px 3px rgba(0,0,0,0.1) | 16px |
| Outlined | #FFFFFF | #E2E8F0 (1px) | none | 16px |
| Filled | #F8FAFC | none | none | 16px |

#### Status Color Coding
| Status | Border Color | Background Accent |
|--------|-------------|-------------------|
| Default | #E2E8F0 | none |
| Warning | #F59E0B | #FEF3C7 (top border) |
| Error | #EF4444 | #FEE2E2 (top border) |
| Success | #10B981 | #D1FAE5 (top border) |

### Navigation

#### Mobile Navigation
- **Bottom Tab Bar**: Primary navigation on mobile
- **Height**: 64px (with safe area)
- **Icons**: 24px with labels
- **Active State**: Primary color with background

#### Desktop Navigation
- **Sidebar**: Collapsed/expanded states
- **Width**: 240px (expanded), 64px (collapsed)
- **Position**: Fixed left side

### Feedback

#### Alerts
```typescript
interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  dismissible?: boolean;
  icon?: boolean;
  title?: string;
  children: React.ReactNode;
}
```

#### Toast Notifications
- **Position**: Top center on mobile, top right on desktop
- **Duration**: 4000ms (success), 6000ms (error), 3000ms (info)
- **Max Stack**: 3 notifications
- **Animation**: Slide down from top, fade out

#### Financial Feedback Patterns
```typescript
interface FinancialToastProps {
  type: 'payment_recorded' | 'session_completed' | 'calculation_error';
  amount?: number;
  currency?: 'SGD';
  playerName?: string;
  sessionDate?: string;
}
```

#### Success Messages
- **Payment Recorded**: "Payment of $XX.XX recorded for [Player Name]"
- **Session Completed**: "Session completed. Total cost: $XX.XX"
- **Balance Updated**: "Balance updated. New balance: $XX.XX"

#### Error Messages
- **Invalid Amount**: "Please enter a valid amount between $0.01 and $1,000.00"
- **Network Error**: "Unable to save. Please check your connection and try again."
- **Validation Error**: "[Specific field] is required"

---

## 🎭 Icons & Imagery

### Icon System
- **Library**: Heroicons v2 (outline style primary)
- **Size Scale**: 16px, 20px, 24px, 32px
- **Style**: Outline for UI, filled for status indicators
- **Weight**: 1.5px stroke width for optimal mobile clarity

#### Badminton App Icon Set
| Icon | Usage | Size | Context |
|------|-------|------|----------|
| 🏸 | App icon, badminton context | 24px | Brand, headers |
| 💰 | Money, payments, costs | 20px | Financial sections |
| 📅 | Sessions, dates, scheduling | 20px | Calendar views |
| 👥 | Players, groups, teams | 20px | Player management |
| ⚙️ | Settings, configuration | 20px | Settings pages |
| ✅ | Completed, success, paid | 16px | Status indicators |
| ⚠️ | Warning, outstanding balance | 16px | Alert states |
| ➕ | Add, create, new | 20px | Action buttons |
| 📊 | Analytics, reports, stats | 20px | Data visualization |

### Icon Usage
| Size | Usage |
|------|-------|
| Small (16px) | Status indicators, inline icons |
| Medium (20px) | Navigation, form icons |
| Large (24px) | Primary actions, headers |
| Extra Large (32px) | Feature illustrations |

### Image Guidelines
- **Aspect Ratios**: 16:9 (session photos), 1:1 (player avatars), 4:3 (court photos)
- **File Formats**: WebP (modern browsers), JPEG (fallback), SVG (icons)
- **Optimization**: Next.js Image component, lazy loading, responsive sizing
- **Placeholder**: Skeleton screens with sport-themed placeholder icons

#### Image Usage
| Type | Max Size | Format | Usage |
|------|----------|--------|-------|
| Player Avatar | 128x128px | WebP/JPEG | Player identification |
| Court Photo | 400x300px | WebP/JPEG | Session location reference |
| App Icons | 24-32px | SVG | UI elements |
| Loading States | N/A | SVG | Skeleton animations |

#### Singapore Context
- **Courts**: Sports Hub, community centers, private clubs
- **Cultural**: Multi-ethnic player representation
- **Language**: English primary, consider basic Chinese/Malay
- **Payment Methods**: PayNow QR codes, local bank logos

---

## 🎬 Motion & Animation

### Animation Principles
1. **Purpose**: Guide attention to important financial updates
2. **Performance**: Keep animations under 300ms for mobile performance
3. **Accessibility**: Respect prefers-reduced-motion setting
4. **Financial Context**: Subtle animations for money updates
5. **Touch Feedback**: Immediate visual response to touch inputs

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration Scale
| Token | Value | Usage |
|-------|-------|-------|
| duration-instant | 100ms | Button press feedback |
| duration-fast | 150ms | Hover states, focus rings |
| duration-normal | 250ms | Page transitions, modal open |
| duration-slow | 400ms | Complex state changes |

### Financial Animation Guidelines
- **Balance Updates**: Gentle fade-in for new amounts
- **Payment Success**: Subtle scale animation (1.0 → 1.05 → 1.0)
- **Form Validation**: Fast shake animation for errors
- **Loading States**: Smooth skeleton pulse animation
- **Touch Feedback**: Instant scale down (0.95) on press

### Common Animations
- **Fade**: Opacity transitions for content changes
- **Slide**: Position transitions for navigation
- **Scale**: Transform for button feedback
- **Skeleton**: Loading state animations

---

## ♿ Accessibility

### Color Accessibility
- **Contrast**: Minimum WCAG AA (4.5:1 for normal text, 3:1 for large text)
- **Color Independence**: Never rely on color alone for information
- **Focus Indicators**: Visible 2px outline for all interactive elements

### Keyboard Navigation
- **Tab Order**: Logical flow through all interactive elements
- **Skip Links**: Jump to main content
- **Keyboard Shortcuts**: Document all available shortcuts
- **Focus Management**: Proper focus restoration in modals

### Screen Reader Support
- **Semantic HTML**: Use appropriate HTML elements
- **ARIA Labels**: Descriptive labels for complex interactions
- **Live Regions**: Announce important financial updates
- **Landmark Navigation**: Clear page structure

### Touch Targets
- **Minimum Size**: 44px × 44px (iOS/Android guideline)
- **Comfortable Size**: 48px × 48px (recommended)
- **Large Actions**: 56px × 48px (primary buttons)
- **Spacing**: Minimum 8px between targets
- **Hit Area**: Extend beyond visual boundaries when needed

### Mobile-Specific Accessibility
- **Thumb Zone**: Place primary actions in easy thumb reach
- **One-Hand Use**: Critical functions accessible with thumb
- **Visual Hierarchy**: Clear focus indicators for assistive tech
- **Voice Control**: Descriptive labels for voice navigation
- **Dynamic Type**: Support iOS/Android font scaling

### Singapore Accessibility Considerations
- **Language**: English primary, basic Chinese character support
- **Cultural**: Multi-ethnic user representation in examples
- **Age Range**: Design for 18-65 age group (typical badminton players)
- **Technical Literacy**: Assume basic smartphone proficiency

---

## 🎯 Design Tokens

### Design Tokens Structure
```typescript
const badmintonTokens = {
  colors: {
    // Primary brand colors
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    
    // Financial semantic colors
    moneyPositive: '#059669',
    moneyNegative: '#DC2626',
    moneyNeutral: '#374151',
    paymentPending: '#D97706',
    
    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Neutral palette
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    border: '#E2E8F0',
    borderFocus: '#3B82F6',
    
    // Text colors
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textDisabled: '#CBD5E1',
  },
  
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: 'SF Mono, Monaco, Consolas, monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  touchTargets: {
    minimum: '44px',
    comfortable: '48px',
    large: '56px',
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  animation: {
    duration: {
      instant: '100ms',
      fast: '150ms',
      normal: '250ms',
      slow: '400ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
};
```

### Token Usage in Components
```typescript
// Example: Money Display Component
const MoneyDisplay = styled.span<{ variant: 'positive' | 'negative' | 'neutral' }>`
  font-family: ${badmintonTokens.typography.fontFamily.mono};
  font-size: ${badmintonTokens.typography.fontSize.lg};
  font-weight: ${badmintonTokens.typography.fontWeight.semibold};
  color: ${props => {
    switch (props.variant) {
      case 'positive': return badmintonTokens.colors.moneyPositive;
      case 'negative': return badmintonTokens.colors.moneyNegative;
      default: return badmintonTokens.colors.moneyNeutral;
    }
  }};
`;

// Example: Touch-Friendly Button
const TouchButton = styled.button`
  min-height: ${badmintonTokens.touchTargets.comfortable};
  padding: ${badmintonTokens.spacing.sm} ${badmintonTokens.spacing.md};
  background: ${badmintonTokens.colors.primary};
  color: white;
  border-radius: ${badmintonTokens.borderRadius.md};
  font-family: ${badmintonTokens.typography.fontFamily.primary};
  font-weight: ${badmintonTokens.typography.fontWeight.medium};
  transition: all ${badmintonTokens.animation.duration.fast} ${badmintonTokens.animation.easing.easeOut};
  
  &:hover {
    background: ${badmintonTokens.colors.primaryDark};
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

// Example: Financial Card
const SessionCard = styled.div`
  background: ${badmintonTokens.colors.surface};
  border: 1px solid ${badmintonTokens.colors.border};
  border-radius: ${badmintonTokens.borderRadius.lg};
  padding: ${badmintonTokens.spacing.lg};
  box-shadow: ${badmintonTokens.shadows.card};
  
  @media (max-width: ${badmintonTokens.breakpoints.sm}) {
    padding: ${badmintonTokens.spacing.md};
    border-radius: ${badmintonTokens.borderRadius.md};
  }
`;
```

---

## 📚 Implementation Guidelines

### Badminton App File Organization
```
src/
├── styles/
│   ├── tokens.ts              # Design token definitions
│   ├── globals.css            # Global styles and CSS variables
│   └── tailwind.config.ts     # Tailwind configuration
├── components/
│   ├── ui/                    # Base design system components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── Button.test.tsx
│   │   ├── MoneyDisplay/
│   │   ├── MoneyInput/
│   │   └── index.ts
│   ├── business/              # Badminton-specific components
│   │   ├── Session/
│   │   ├── Payment/
│   │   ├── Player/
│   │   └── Balance/
│   └── layout/                # Layout components
│       ├── DashboardLayout.tsx
│       ├── MobileNavigation.tsx
│       └── PageLayout.tsx
├── lib/
│   ├── utils/
│   │   ├── cn.ts              # className utility
│   │   ├── formatMoney.ts     # Money formatting
│   │   └── responsive.ts      # Responsive utilities
│   └── constants/
│       ├── design-tokens.ts   # Exported tokens
│       └── touch-targets.ts   # Touch target constants
└── stories/                   # Storybook stories
    ├── tokens.stories.mdx     # Design token documentation
    ├── colors.stories.tsx     # Color palette showcase
    └── typography.stories.tsx # Typography examples
```

### Naming Conventions
- **Components**: PascalCase (Button, SessionCard, MoneyInput)
- **Props**: camelCase (isDisabled, showBalance, onPaymentSubmit)
- **CSS Classes**: kebab-case (button-primary, money-display)
- **Design Tokens**: camelCase (colorPrimary, spacingMd, touchTargetMin)

### Badminton App Component Development
1. **Start with mobile design** (320px viewport)
2. **Use design tokens** for all styling decisions
3. **Build financial components** with Decimal.js integration
4. **Ensure touch accessibility** (44px+ targets)
5. **Test with real data** (Singapore phone numbers, SGD amounts)
6. **Document with Storybook** including financial examples
7. **Validate accessibility** with screen readers
8. **Performance test** on mobile devices

### Singapore-Specific Testing
- **Phone Numbers**: +65 XXXX XXXX format validation
- **Currency**: SGD $X,XXX.XX formatting
- **Names**: Support for Chinese, Malay, Indian names
- **Network**: Test on slower 4G connections
- **Devices**: iPhone SE, Samsung Galaxy A-series (budget phones)

### Design System Evolution
- **Version 1.0**: Core components, mobile-first
- **Version 1.1**: Enhanced financial features
- **Version 1.2**: Accessibility improvements
- **Version 2.0**: Potential tablet optimization
- **Version 2.1**: Potential dark mode support

---

## 🏸 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. **Set up design tokens** in Tailwind CSS v4 configuration
2. **Create base components**: Button, Input, Card, Layout
3. **Implement typography system** with Inter and SF Mono fonts
4. **Mobile-first responsive breakpoints** setup

### Phase 2: Financial Components (Week 3-4)
1. **MoneyDisplay component** with proper formatting
2. **MoneyInput component** with validation
3. **BalanceCard component** with status indicators
4. **PaymentCard component** with method display

### Phase 3: Business Components (Week 5-6)
1. **SessionCard component** with cost breakdown
2. **SessionForm component** with validation
3. **PlayerCard component** with balance display
4. **Dashboard layout** with mobile navigation

### Phase 4: Enhancement (Week 7-8)
1. **Animation system** implementation
2. **Dark mode** consideration (future)
3. **Accessibility audit** and improvements
4. **Performance optimization** for mobile

### Design System Maintenance
- **Weekly**: Update during component development
- **Monthly**: Review consistency across app
- **Quarterly**: Accessibility and performance audit
- **User Testing**: Validate with actual badminton players

### Success Metrics
- **Touch Target Compliance**: 100% of interactive elements ≥44px
- **Accessibility Score**: WCAG 2.1 AA compliance
- **Mobile Performance**: Lighthouse score ≥90
- **User Satisfaction**: Clear financial displays, easy navigation

### Tools Integration
- **Tailwind CSS v4**: Design token integration
- **Storybook**: Component documentation and testing
- **Figma**: Design handoff and specifications
- **TypeScript**: Strict typing for component props