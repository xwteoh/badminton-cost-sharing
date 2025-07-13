# Claude Code Guide - Badminton Cost Sharing App

## 🔒 DOCUMENTATION GOVERNANCE PROTOCOL

**CRITICAL**: This project operates under STRICT documentation governance. ALL implementation must align with established documentation. NO EXCEPTIONS.

### 📋 Master Source of Truth
**`docs/project_context.md`** is the SINGLE SOURCE OF TRUTH for all requirements. 

**BEFORE ANY IMPLEMENTATION:**
1. ✅ Verify alignment with `project_context.md`
2. ✅ If not aligned: STOP → Update `project_context.md` → Get user approval → Proceed
3. ✅ Log all changes in `docs/docs_change_log.md`

### 🛡️ Mandatory Compliance Standards
**NO CODE CAN BE WRITTEN without strict adherence to:**
- `docs/coding_standards.md` - Mobile-first, financial precision, TypeScript strict mode
- `docs/security_standards.md` - OWASP/NIST compliance, financial data protection  
- `docs/supabase_security_guide.md` - RLS policies, database security patterns

### 🎨 UI/UX Coherence Requirements
**ALL UI MUST follow exactly:**
- `docs/design_system.md` - Design tokens, components, patterns
- `docs/screen_specifications.md` - Screen layouts, interactions, navigation flows
- Mobile-first approach with 44px+ touch targets
- Singapore-specific PayNow integration patterns

### 📁 Structural Integrity
**ALL files MUST follow:**
- `docs/folder_structure.md` - Next.js 15 App Router organization
- Component placement in designated directories
- Naming conventions for badminton business logic

### 🔄 Automatic Session Management
**EVERY SESSION MUST:**
1. Start by reading `SESSION_STATE.md` for context
2. Update `docs/implementation_status.md` for completed features
3. End by updating `SESSION_STATE.md` with progress
4. Log any scope changes in `docs/docs_change_log.md`

### 📚 Lessons Learned Integration
**BEFORE solving any problem:**
1. Consult `docs/lessons_learned.md` for similar issues
2. If debugging >1 hour: Create new lesson entry
3. Reference existing lessons to prevent repeated mistakes

## Project Overview
A mobile-first cost sharing application for badminton groups, replacing Access DB + Excel workflows with real-time session cost tracking and player debt management.

## Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Phone Auth, PostgreSQL, RLS)
- **UI Components**: Lucide React icons, Supabase Auth UI
- **Development**: ESLint, Node.js

## Commands
```bash
# Development
npm run dev          # Start development server

# Build & Deploy
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Project Structure
```
badminton-app/
├── docs/           # Documentation and detailed plans
│   └── plans/      # Detailed implementation plans
├── src/
│   ├── app/        # Next.js App Router pages
│   ├── components/ # UI components (mobile-first)
│   └── lib/        # Supabase client and utilities
├── public/         # Static assets
└── types/          # TypeScript definitions
```

## Architecture Principles
- **Mobile-First**: Organizers record sessions on phone during/after games
- **Supabase-First**: Direct database access via RLS instead of custom APIs
- **Role-Based Access**: Organizers see all data, players see only their own
- **Real-time Updates**: Balance changes sync immediately
- **Speed**: Session recording <2min, payment entry <1min

## Core Business Logic
- **Cost Sharing**: (hours × court rate) + (shuttlecocks × shuttle rate) ÷ attendees
- **Running Tab**: Players can have debt, pay when convenient
- **Temporary Players**: Drop-ins share equal costs without permanent membership
- **Payment Tracking**: PayNow transfers confirmed manually via WhatsApp

## Development Guidelines
- Follow mobile-first responsive design
- Use PostgreSQL functions for complex calculations
- Implement Supabase RLS for data security
- Large touch targets (44px minimum)
- Clear debt/credit visual indicators
- Error prevention with confirmation dialogs

## 🔄 ENHANCED SESSION PROTOCOL

### Session Initialization (MANDATORY)
```
🔍 PRE-IMPLEMENTATION VALIDATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Read SESSION_STATE.md for current context
□ Verify project_context.md alignment for planned work
□ Check lessons_learned.md for similar problems
□ Confirm adherence to coding_standards.md patterns
□ Validate UI work against design_system.md
□ Ensure folder_structure.md compliance for new files

🚨 IF ANY CHECKBOX FAILS: STOP AND RESOLVE FIRST
```

### Implementation Phase Protocols
1. **Start**: Execute validation checklist above
2. **Reference**: Cross-check all relevant documentation files
3. **Develop**: Follow established patterns, NO deviations
4. **Validate**: Verify standards compliance in real-time
5. **Document**: Update status and log changes immediately

### Session Completion (AUTOMATIC)
```
📋 POST-IMPLEMENTATION UPDATE CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Update implementation_status.md with completed features
□ Update SESSION_STATE.md with session progress
□ Log any decisions/changes in docs_change_log.md
□ Create lessons_learned.md entries for issues >1 hour
□ Verify all documentation remains synchronized
```

### Real-Time Compliance Monitoring
**DURING DEVELOPMENT - AUTOMATIC CHECKS:**
- Code patterns validate against coding_standards.md
- Financial operations comply with security_standards.md  
- UI components match design_system.md specifications
- File placement follows folder_structure.md organization
- All new features align with project_context.md scope

## 📚 DOCUMENTATION HIERARCHY & MONITORING

### Tier 1: Critical (Master Sources)
- **`docs/project_context.md`** - MASTER requirements & business rules
- **`SESSION_STATE.md`** - Current session context & progress
- **`docs/implementation_status.md`** - Feature completion tracking

### Tier 2: Implementation Standards (Mandatory Compliance)
- **`docs/coding_standards.md`** - Code patterns, financial precision
- **`docs/security_standards.md`** - OWASP/NIST financial app security
- **`docs/supabase_security_guide.md`** - Database security & RLS
- **`docs/design_system.md`** - UI tokens, components, patterns
- **`docs/screen_specifications.md`** - Screen layouts & interactions
- **`docs/folder_structure.md`** - File organization & naming

### Tier 3: Reference & Planning
- **`docs/plans/database_schema.md`** - Database design specifications
- **`docs/plans/supabase_rls_setup.md`** - Security implementation details
- **`docs/plans/uiux_wireframes.md`** - Mobile interface wireframes
- **`docs/plans/badminton_requirements.md`** - Detailed business requirements

### Tier 4: Process & Improvement
- **`docs/lessons_learned.md`** - Problem patterns & solutions
- **`docs/docs_change_log.md`** - Change tracking & audit trail

### Automatic Documentation Synchronization
**Real-time monitoring for:**
- Implementation drift from project_context.md
- Standards violations in code patterns
- UI inconsistencies with design system
- Security pattern deviations
- File organization violations

## Authentication Flow
Using Supabase Auth with:
- Phone number + OTP verification
- Automatic role assignment (organizer vs player)
- Row Level Security (RLS) for data access control
- No email required - phone only

## Database Approach
- **Direct Supabase Access**: No custom API endpoints needed
- **PostgreSQL Functions**: Complex balance calculations in database
- **RLS Policies**: Role-based data access control
- **Real-time Subscriptions**: Automatic balance updates

## User Roles
- **Organizer**: Full CRUD access to sessions, players, payments
- **Player**: Read-only access to own balance, session history, upcoming sessions

## 🚨 CRITICAL DECISION POINTS

### Before Writing ANY Code
```
⚠️  MANDATORY ALIGNMENT CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ Does this implementation align with project_context.md?
   □ YES → Proceed with standards compliance checks
   □ NO → STOP! Update project_context.md first

❓ Does this follow all mandatory standards?
   □ coding_standards.md compliance
   □ security_standards.md compliance  
   □ design_system.md compliance
   □ folder_structure.md compliance

❓ Is this a repeated problem from lessons_learned.md?
   □ Check existing solutions first
   □ Apply established prevention strategies

🔴 IF ANY CHECK FAILS: RESOLVE BEFORE PROCEEDING
```

### Change Management Protocol
**IF IMPLEMENTATION REQUIRES DEVIATION:**
1. 🛑 **STOP all implementation work**
2. 📝 **Identify specific documentation that needs updating**
3. 💬 **Request user approval for documentation changes**
4. ✏️ **Update relevant documentation files**
5. 📋 **Log changes in docs_change_log.md**
6. ✅ **Only then proceed with implementation**

### Error Prevention System
**Consult lessons_learned.md FIRST for:**
- Similar problems or patterns
- Established solutions and prevention strategies
- Time-saving approaches for known issues

**Auto-capture new lessons when:**
- Debugging session exceeds 1 hour
- Non-obvious solutions discovered
- Repeated patterns emerge
- Architecture decisions made

---

**Last Updated**: 2025-07-13  
**Governance Version**: 2.0 (Enhanced Automation)  
**Compliance Level**: STRICT (No Exceptions)