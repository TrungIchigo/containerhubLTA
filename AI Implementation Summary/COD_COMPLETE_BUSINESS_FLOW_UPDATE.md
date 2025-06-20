 # COD Complete 6-Stage Business Flow Implementation

## Overview
Updated the COD (Change of Delivery) module to implement the complete 6-stage business flow as described in the Vietnamese business requirements. This update moves from a simple approval/decline system to a comprehensive workflow that includes delivery confirmation, payment processing, and depot operations.

## 🎯 Business Flow Stages

### Stage 1: Request Initiation (PENDING)
- **Actor**: Dispatcher
- **Action**: Creates COD request with automatic fee calculation
- **System**: Request created with PENDING status, container locked with AWAITING_COD_APPROVAL

### Stage 2: Approval Process (PENDING → APPROVED/DECLINED)
- **Actor**: LTA Admin (Carrier Admin)
- **Action**: Reviews and approves/declines on dashboard
- **System**: Status becomes APPROVED with timestamp, container location updated but status remains AWAITING_COD_APPROVAL

### Stage 3: Delivery Confirmation (APPROVED → PENDING_PAYMENT)
- **Actor**: Dispatcher
- **Action**: Confirms delivery completion at new location
- **System**: Status becomes PENDING_PAYMENT, container status becomes CONFIRMED

### Stage 4: Payment Confirmation (PENDING_PAYMENT → PAID)
- **Actor**: LTA Admin
- **Action**: Confirms payment received for COD fee
- **System**: Status becomes PAID, transaction marked as PAID in billing system

### Stage 5: Depot Processing (PAID → PROCESSING_AT_DEPOT)
- **Actor**: Admin/System
- **Action**: Initiates depot processing
- **System**: Status becomes PROCESSING_AT_DEPOT

### Stage 6: Completion (PROCESSING_AT_DEPOT → COMPLETED)
- **Actor**: e-Depot Integration/Admin
- **Action**: Signals completion of depot operations
- **System**: Status becomes COMPLETED, container status becomes AVAILABLE

## 🗃️ Database Schema Updates

### Updated `cod_requests` Table
```sql
-- New timestamp columns for tracking each stage
ALTER TABLE cod_requests 
ADD COLUMN approved_at TIMESTAMPTZ,
ADD COLUMN declined_at TIMESTAMPTZ,
ADD COLUMN delivery_confirmed_at TIMESTAMPTZ,
ADD COLUMN payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN depot_processing_started_at TIMESTAMPTZ,
ADD COLUMN completed_at TIMESTAMPTZ;

-- New status enum values
ALTER TYPE cod_request_status ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE cod_request_status ADD VALUE 'PAID'; 
ALTER TYPE cod_request_status ADD VALUE 'PROCESSING_AT_DEPOT';
ALTER TYPE cod_request_status ADD VALUE 'COMPLETED';
```

### New Helper Functions
- `update_cod_request_status()`: Automatically handles status updates with proper timestamping
- `get_cod_requests_pending_payment()`: Returns COD requests awaiting payment confirmation
- `cod_request_flow_view`: Monitoring view with duration calculations

### Database Constraints
- Added status progression validation constraints
- Ensured proper timestamp relationships
- Added performance indexes for billing queries

## 🔧 Backend Implementation

### Updated COD Actions (`src/lib/actions/cod.ts`)

#### Modified `handleCodDecision()`
- **Before**: Simple approve/decline with container status → AVAILABLE
- **After**: 
  - Approval sets status to APPROVED with `approved_at` timestamp
  - Container remains AWAITING_COD_APPROVAL until delivery confirmed
  - Creates billing transaction for COD fee if > 0
  - Proper audit logging with detailed information

#### New Server Actions
1. **`confirmCodDelivery()`**
   - Dispatcher confirms delivery completion
   - Updates status: APPROVED → PENDING_PAYMENT
   - Container status: AWAITING_COD_APPROVAL → CONFIRMED
   - Records `delivery_confirmed_at` timestamp

2. **`confirmCodPayment()`**
   - Admin confirms payment received
   - Updates status: PENDING_PAYMENT → PAID
   - Updates transaction status to PAID in billing system
   - Records `payment_confirmed_at` timestamp

3. **`startDepotProcessing()`**
   - Admin starts depot operations
   - Updates status: PAID → PROCESSING_AT_DEPOT
   - Records `depot_processing_started_at` timestamp

4. **`completeCodProcess()`**
   - Admin/e-Depot signals completion
   - Updates status: PROCESSING_AT_DEPOT → COMPLETED
   - Container status: CONFIRMED → AVAILABLE
   - Records `completed_at` timestamp

### API Routes
- **`/api/cod/pending-payments`**: Returns COD requests awaiting payment confirmation for billing dashboard

## 🎨 Frontend Updates

### Admin Billing Dashboard (`src/components/admin/AdminBillingDashboard.tsx`)
- **New Tab**: "COD Chờ Thanh Toán"
- **Features**:
  - Lists all COD requests in PENDING_PAYMENT status
  - Shows days since delivery confirmation
  - Color-coded urgency indicators (>7 days = red, >3 days = yellow)
  - One-click payment confirmation
  - Real-time updates after action completion

### Carrier Admin COD Requests (`src/app/(main)/carrier-admin/cod-requests/page.tsx`)
- **Enhanced Status Badges**: Support for all 10 status values
- **Updated Approval Flow**: Container status logic follows new business rules
- **Improved Dialogs**: Better data mapping and error handling

### Status Badge Improvements
- **10 Status Support**: PENDING, APPROVED, DECLINED, PENDING_PAYMENT, PAID, PROCESSING_AT_DEPOT, COMPLETED, EXPIRED, REVERSED, AWAITING_INFO
- **Consistent Styling**: Using Badge component variants throughout
- **Vietnamese Labels**: User-friendly status descriptions

## 💰 Billing Integration

### Transaction Creation
- **When**: COD request approved with fee > 0
- **Type**: `COD_SERVICE_FEE`
- **Status Flow**: UNPAID → PAID
- **Integration**: Automatic transaction creation in billing system

### Payment Confirmation
- **Trigger**: Admin confirms COD payment received
- **Actions**:
  - COD request status: PENDING_PAYMENT → PAID
  - Transaction status: UNPAID → PAID
  - Timestamp: `payment_confirmed_at` recorded

### Billing Dashboard Integration
- COD payments visible in admin billing dashboard
- Real-time tracking of pending payments
- Automated status synchronization

## 📊 Monitoring & Reporting

### COD Flow View
```sql
CREATE VIEW cod_request_flow_view AS
SELECT 
    cr.id,
    cr.status,
    ic.container_number,
    req_org.name as requesting_organization,
    app_org.name as approving_organization,
    -- Duration calculations
    hours_to_approval,
    total_hours_to_completion,
    -- Status flags for easy filtering
    is_pending, is_approved, is_awaiting_payment, etc.
```

### Performance Metrics
- Time to approval tracking
- End-to-end completion duration
- Payment delay monitoring
- Depot processing efficiency

## 🔒 Security & Authorization

### Permission Checks
- **Dispatcher**: Can create requests, confirm delivery
- **Carrier Admin**: Can approve/decline, confirm payment
- **Admin**: Full access to all stages
- **Organization Boundaries**: Users can only act on their organization's requests

### Audit Trail
- Complete action logging in `cod_audit_logs`
- Actor tracking with user ID and organization
- Detailed action metadata in JSON format
- Timestamp tracking for all stage transitions

## 📋 Status Mapping Reference

| Status | Stage | Actor | Description | Next Status |
|--------|-------|-------|-------------|-------------|
| PENDING | 1 | System | Request created, awaiting approval | APPROVED/DECLINED |
| APPROVED | 3 | Admin | Approved, awaiting delivery | PENDING_PAYMENT |
| PENDING_PAYMENT | 4 | System | Delivered, awaiting payment | PAID |
| PAID | 5 | Admin | Payment confirmed | PROCESSING_AT_DEPOT |
| PROCESSING_AT_DEPOT | 6 | Admin | Depot processing started | COMPLETED |
| COMPLETED | 7 | System | Process complete | - |
| DECLINED | 2 | Admin | Request declined | - |

## 🚀 Deployment Notes

### Database Migration
1. Run `SQL/19-06-2025/04_update_cod_status_enum.sql`
2. Verify new columns and constraints
3. Test helper functions

### Feature Flags
- New COD flow is enabled by default
- Backward compatible with existing PENDING/APPROVED requests
- Existing containers will follow new business rules

### Testing Checklist
- [ ] COD request creation (Stage 1)
- [ ] Admin approval with fee creation (Stage 2-3)
- [ ] Dispatcher delivery confirmation (Stage 4)
- [ ] Admin payment confirmation (Stage 5)
- [ ] Depot processing flow (Stage 6-7)
- [ ] Billing integration end-to-end
- [ ] Permission boundaries
- [ ] Status badge display

## 📈 Impact & Benefits

### Business Process Improvement
- **Complete Workflow**: End-to-end tracking from request to completion
- **Payment Control**: Clear separation of delivery and payment confirmation
- **Audit Trail**: Full visibility into process stages and timing
- **Performance Metrics**: Data-driven insights into COD operations

### Technical Improvements
- **Database Integrity**: Proper constraints and validation
- **Real-time Updates**: Automatic UI refresh after status changes
- **Billing Integration**: Seamless financial tracking
- **Monitoring**: Comprehensive view for operations team

### User Experience
- **Clear Status**: Easy-to-understand Vietnamese status labels
- **Action Clarity**: Role-based actions with clear next steps
- **Progress Tracking**: Visual indicators of workflow progress
- **Automated Billing**: Transparent fee handling

## 🔮 Future Enhancements

### Planned Features
1. **e-Depot Integration**: Automatic status updates from depot systems
2. **SLA Monitoring**: Alert system for delayed payments/processing
3. **Batch Operations**: Bulk confirmation for multiple requests
4. **Mobile Notifications**: Real-time alerts for status changes
5. **Advanced Reporting**: Analytics dashboard for COD performance

### API Extensions
- Webhook support for external integrations
- Bulk status update endpoints
- Historical reporting APIs
- Real-time notification system

---

**Implementation Date**: June 2025  
**Version**: 2.0  
**Status**: Production Ready  
**Documentation**: Complete