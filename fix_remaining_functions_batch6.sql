-- Fix remaining functions batch 6: Financial and Invoice functions
-- Functions: create_prepaid_fund_for_organization, mark_invoice_as_paid, create_invoice_for_organization, generate_invoice_number

-- Fix create_prepaid_fund_for_organization function
CREATE OR REPLACE FUNCTION public.create_prepaid_fund_for_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    fund_code_seq INTEGER;
    generated_fund_code TEXT;
BEGIN
    -- Tạo mã quỹ tự động: LP + 7 chữ số
    SELECT COALESCE(MAX(CAST(SUBSTRING(fund_code FROM 3) AS INTEGER)), 0) + 1
    INTO fund_code_seq
    FROM public.organization_prepaid_funds
    WHERE fund_code LIKE 'LP%';
    
    generated_fund_code := 'LP' || LPAD(fund_code_seq::TEXT, 7, '0');
    
    -- Tạo quỹ prepaid cho organization mới
    INSERT INTO public.organization_prepaid_funds (
        organization_id,
        fund_code,
        fund_name,
        balance
    ) VALUES (
        NEW.id,
        generated_fund_code,
        NEW.name || ' - Quỹ i-Prepaid@LTA',
        0
    );
    
    RETURN NEW;
END;
$$;

-- Fix mark_invoice_as_paid function
CREATE OR REPLACE FUNCTION public.mark_invoice_as_paid(
    invoice_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.invoices
    SET 
        status = 'PAID',
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = invoice_id AND status = 'PENDING';
    
    RETURN FOUND;
END;
$$;

-- Fix create_invoice_for_organization function
CREATE OR REPLACE FUNCTION public.create_invoice_for_organization(
    org_id UUID,
    amount NUMERIC,
    description TEXT,
    due_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    invoice_id UUID;
    invoice_number TEXT;
BEGIN
    -- Generate invoice number
    SELECT public.generate_invoice_number() INTO invoice_number;
    
    -- Create invoice
    INSERT INTO public.invoices (
        organization_id,
        invoice_number,
        amount,
        description,
        due_date,
        status
    ) VALUES (
        org_id,
        invoice_number,
        amount,
        description,
        COALESCE(due_date, CURRENT_DATE + INTERVAL '30 days'),
        'PENDING'
    ) RETURNING id INTO invoice_id;
    
    RETURN invoice_id;
END;
$$;

-- Fix generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    invoice_seq INTEGER;
    current_year TEXT;
    current_month TEXT;
BEGIN
    -- Get current year and month
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    current_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(invoice_number) - 2) AS INTEGER)), 0) + 1
    INTO invoice_seq
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-' || current_year || '-' || current_month || '-%';
    
    -- Return formatted invoice number: INV-YYYY-MM-XXX
    RETURN 'INV-' || current_year || '-' || current_month || '-' || LPAD(invoice_seq::TEXT, 3, '0');
END;
$$;

PRINT 'Fixed create_prepaid_fund_for_organization, mark_invoice_as_paid, create_invoice_for_organization, and generate_invoice_number functions with SECURITY DEFINER and SET search_path = \'\'.';