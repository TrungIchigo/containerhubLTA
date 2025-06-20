-- ============================================
-- BILLING & INVOICING MODULE SCHEMA
-- ============================================

-- Tạo các ENUM types cho trạng thái giao dịch và hóa đơn
CREATE TYPE public.transaction_status AS ENUM ('UNPAID', 'INVOICED', 'PAID', 'CANCELLED');
CREATE TYPE public.invoice_status AS ENUM ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- Cập nhật transaction_type enum để bao gồm các loại phí mới
DO $$ 
BEGIN
    -- Kiểm tra nếu enum đã tồn tại
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE public.transaction_type AS ENUM ('COD_SERVICE_FEE', 'MARKETPLACE_FEE');
    ELSE
        -- Thêm các giá trị mới nếu chưa có
        BEGIN
            ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'COD_SERVICE_FEE';
            ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'MARKETPLACE_FEE';
        EXCEPTION WHEN others THEN
            NULL; -- Ignore if values already exist
        END;
    END IF;
END $$;

-- Bảng lưu từng giao dịch phát sinh phí
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payer_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    related_request_id UUID, -- ID của yêu cầu street-turn hoặc COD liên quan
    transaction_type public.transaction_type NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    description TEXT,
    status public.transaction_status NOT NULL DEFAULT 'UNPAID',
    invoice_id UUID, -- Sẽ được cập nhật khi hóa đơn được tạo
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng lưu hóa đơn tổng hợp
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE, -- Ví dụ: INV-2025-06-001
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status public.invoice_status NOT NULL DEFAULT 'PENDING',
    payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Thêm foreign key constraint cho liên kết transactions với invoices
ALTER TABLE public.transactions
ADD CONSTRAINT fk_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Tạo indexes để tối ưu hóa performance
CREATE INDEX IF NOT EXISTS idx_transactions_payer_org_id ON public.transactions(payer_org_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON public.transactions(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON public.transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON public.invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function để tự động generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
    invoice_num TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    current_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
    
    -- Lấy số sequence tiếp theo cho tháng hiện tại
    SELECT COALESCE(MAX(
        CASE 
            WHEN invoice_number ~ ('^INV-' || current_year || '-' || current_month || '-\d{3}$')
            THEN SUBSTRING(invoice_number FROM '\d{3}$')::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-' || current_year || '-' || current_month || '-%';
    
    invoice_num := 'INV-' || current_year || '-' || current_month || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies for transactions
CREATE POLICY "Users can view their organization's transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations uo
            WHERE uo.organization_id = transactions.payer_org_id
            AND uo.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.user_organizations uo
            JOIN public.organizations o ON uo.organization_id = o.id
            WHERE uo.user_id = auth.uid()
            AND o.organization_type = 'ADMIN'
        )
    );

CREATE POLICY "Only system can insert transactions" ON public.transactions
    FOR INSERT WITH CHECK (false);

CREATE POLICY "Only system can update transactions" ON public.transactions
    FOR UPDATE USING (false);

-- Policies for invoices
CREATE POLICY "Users can view their organization's invoices" ON public.invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations uo
            WHERE uo.organization_id = invoices.organization_id
            AND uo.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.user_organizations uo
            JOIN public.organizations o ON uo.organization_id = o.id
            WHERE uo.user_id = auth.uid()
            AND o.organization_type = 'ADMIN'
        )
    );

CREATE POLICY "Only admins can manage invoices" ON public.invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations uo
            JOIN public.organizations o ON uo.organization_id = o.id
            WHERE uo.user_id = auth.uid()
            AND o.organization_type = 'ADMIN'
        )
    );

-- Function để tạo hóa đơn từ các giao dịch chưa thanh toán
CREATE OR REPLACE FUNCTION create_invoice_for_organization(
    org_id UUID,
    period_start_date DATE,
    period_end_date DATE
)
RETURNS UUID AS $$
DECLARE
    new_invoice_id UUID;
    total_amount NUMERIC;
    new_invoice_number TEXT;
BEGIN
    -- Tính tổng số tiền từ các giao dịch chưa thanh toán
    SELECT COALESCE(SUM(amount), 0)
    INTO total_amount
    FROM public.transactions
    WHERE payer_org_id = org_id
    AND status = 'UNPAID'
    AND created_at >= period_start_date
    AND created_at <= period_end_date + INTERVAL '1 day' - INTERVAL '1 second';
    
    -- Nếu không có giao dịch nào, không tạo hóa đơn
    IF total_amount = 0 THEN
        RETURN NULL;
    END IF;
    
    -- Generate invoice number
    new_invoice_number := generate_invoice_number();
    
    -- Tạo hóa đơn mới
    INSERT INTO public.invoices (
        organization_id,
        invoice_number,
        period_start,
        period_end,
        total_amount,
        due_date
    ) VALUES (
        org_id,
        new_invoice_number,
        period_start_date,
        period_end_date,
        total_amount,
        CURRENT_DATE + INTERVAL '30 days'
    ) RETURNING id INTO new_invoice_id;
    
    -- Cập nhật trạng thái các giao dịch liên quan
    UPDATE public.transactions
    SET status = 'INVOICED',
        invoice_id = new_invoice_id
    WHERE payer_org_id = org_id
    AND status = 'UNPAID'
    AND created_at >= period_start_date
    AND created_at <= period_end_date + INTERVAL '1 day' - INTERVAL '1 second';
    
    RETURN new_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function để đánh dấu hóa đơn đã thanh toán
CREATE OR REPLACE FUNCTION mark_invoice_as_paid(invoice_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Cập nhật trạng thái hóa đơn
    UPDATE public.invoices
    SET status = 'PAID',
        payment_date = CURRENT_DATE
    WHERE id = invoice_id;
    
    -- Cập nhật trạng thái các giao dịch liên quan
    UPDATE public.transactions
    SET status = 'PAID'
    WHERE invoice_id = invoice_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 