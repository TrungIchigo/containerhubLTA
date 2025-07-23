-- =====================================================
-- CREATE PREPAID FUND TEST DATA
-- =====================================================

-- 1. Chạy script prepaid fund schema trước
-- (Assuming the schema from 16_create_prepaid_fund_schema.sql has been run)

-- 2. Tạo prepaid fund cho organizations hiện tại nếu chưa có
INSERT INTO public.organization_prepaid_funds (organization_id, fund_code, fund_name, balance)
SELECT 
    o.id,
    'LP' || LPAD((ROW_NUMBER() OVER (ORDER BY o.created_at))::TEXT, 7, '0'),
    o.name || ' - Quỹ i-Prepaid@LTA',
    CASE 
        WHEN o.type = 'TRUCKING_COMPANY' THEN 3000000  -- 3 triệu VNĐ cho test
        ELSE 1000000  -- 1 triệu cho các org khác để test
    END
FROM public.organizations o
LEFT JOIN public.organization_prepaid_funds opf ON o.id = opf.organization_id
WHERE opf.id IS NULL
  AND o.type IN ('TRUCKING_COMPANY', 'FREIGHT_FORWARDER', 'SHIPPER');

-- 3. Cập nhật số dư một số quỹ để test
UPDATE public.organization_prepaid_funds 
SET balance = 2000000  -- 2 triệu VNĐ
WHERE organization_id IN (
    SELECT organization_id 
    FROM organization_prepaid_funds 
    ORDER BY created_at 
    LIMIT 2
);

-- 4. Tạo một số fund transactions để test lịch sử
DO $$
DECLARE
    fund_record RECORD;
BEGIN
    FOR fund_record IN 
        SELECT id, organization_id, balance 
        FROM organization_prepaid_funds 
        WHERE balance > 0
        LIMIT 3
    LOOP
        -- Tạo giao dịch nạp tiền
        INSERT INTO fund_transactions (
            fund_id,
            transaction_type,
            amount,
            description,
            balance_before,
            balance_after,
            status,
            created_at
        ) VALUES (
            fund_record.id,
            'TOP_UP',
            fund_record.balance,
            'Nạp tiền khởi tạo cho testing',
            0,
            fund_record.balance,
            'CONFIRMED',
            NOW() - INTERVAL '1 day'
        );
        
        -- Tạo giao dịch thanh toán COD (nếu có đủ số dư)
        IF fund_record.balance >= 500000 THEN
            INSERT INTO fund_transactions (
                fund_id,
                transaction_type,
                amount,
                description,
                balance_before,
                balance_after,
                status,
                created_at
            ) VALUES (
                fund_record.id,
                'PAYMENT',
                500000,
                'Thanh toán phí COD cho container test',
                fund_record.balance,
                fund_record.balance - 500000,
                'CONFIRMED',
                NOW() - INTERVAL '2 hours'
            );
            
            -- Cập nhật số dư thực tế
            UPDATE organization_prepaid_funds 
            SET 
                balance = fund_record.balance - 500000,
                total_topped_up = fund_record.balance,
                total_spent = 500000,
                last_topup_at = NOW() - INTERVAL '1 day',
                last_payment_at = NOW() - INTERVAL '2 hours'
            WHERE id = fund_record.id;
        END IF;
    END LOOP;
END $$;

-- 5. Tạo một số QR codes test (expired để test expiry logic)
DO $$
DECLARE
    org_record RECORD;
    fund_record RECORD;
BEGIN
    FOR org_record IN 
        SELECT id FROM organizations WHERE type = 'TRUCKING_COMPANY' LIMIT 2
    LOOP
        SELECT * INTO fund_record 
        FROM organization_prepaid_funds 
        WHERE organization_id = org_record.id;
        
        IF fund_record.id IS NOT NULL THEN
            -- QR code đã hết hạn
            INSERT INTO payment_qr_codes (
                organization_id,
                related_fund_id,
                qr_code_data,
                qr_purpose,
                amount,
                account_number,
                account_name,
                transfer_content,
                is_active,
                expires_at,
                created_at
            ) VALUES (
                org_record.id,
                fund_record.id,
                'BANK=LPB|ACC=1234567890|AMOUNT=1000000|CONTENT=NAP QUY ' || fund_record.fund_code,
                'TOP_UP',
                1000000,
                '1234567890',
                'CONG TY CO PHAN LOGISTICS TECHNOLOGY APPLICATION',
                'NAP QUY ' || fund_record.fund_code,
                false,
                NOW() - INTERVAL '1 hour',
                NOW() - INTERVAL '2 hours'
            );
        END IF;
    END LOOP;
END $$;

-- 6. Verify test data
SELECT 
    'PREPAID FUNDS' as data_type,
    COUNT(*) as count,
    SUM(balance) as total_balance
FROM organization_prepaid_funds;

SELECT 
    'FUND TRANSACTIONS' as data_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM fund_transactions;

SELECT 
    'QR CODES' as data_type,
    COUNT(*) as count
FROM payment_qr_codes;

-- 7. Show current test funds with balances
SELECT 
    opf.fund_code,
    opf.fund_name,
    opf.balance,
    opf.total_topped_up,
    opf.total_spent,
    o.name as organization_name
FROM organization_prepaid_funds opf
JOIN organizations o ON opf.organization_id = o.id
WHERE opf.balance > 0
ORDER BY opf.balance DESC; 