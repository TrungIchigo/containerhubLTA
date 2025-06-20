-- Partner Reviews Migration
-- Hệ thống đánh giá đối tác cho marketplace transactions

-- Bảng để lưu trữ đánh giá giữa các đối tác
CREATE TABLE public.partner_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.street_turn_requests(id),
    reviewer_org_id UUID NOT NULL REFERENCES public.organizations(id),
    reviewee_org_id UUID NOT NULL REFERENCES public.organizations(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ràng buộc quan trọng: Đảm bảo một bên chỉ có thể đánh giá một giao dịch một lần
    UNIQUE (request_id, reviewer_org_id)
);

COMMENT ON TABLE public.partner_reviews IS 'Lưu trữ đánh giá giữa các công ty vận tải sau một giao dịch marketplace thành công.';

-- Bật RLS cho bảng mới
ALTER TABLE public.partner_reviews ENABLE ROW LEVEL SECURITY;

-- Policy cho phép xem tất cả đánh giá (public visibility)
CREATE POLICY "Users can view all reviews" ON public.partner_reviews 
FOR SELECT 
USING (true);

-- Policy cho phép insert đánh giá chỉ cho giao dịch của chính mình
CREATE POLICY "Users can only insert reviews for their own transactions" ON public.partner_reviews 
FOR INSERT 
WITH CHECK (
    reviewer_org_id = (
        SELECT organization_id FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- Tạo hàm để lấy chi tiết đánh giá của một organization
CREATE OR REPLACE FUNCTION get_org_rating_details(org_id UUID)
RETURNS jsonb AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'average_rating', COALESCE(AVG(rating), 0),
            'review_count', COUNT(id)
        )
        FROM public.partner_reviews
        WHERE reviewee_org_id = org_id
    );
END;
$$ LANGUAGE plpgsql;

-- Tạo indexes để tăng hiệu suất truy vấn
CREATE INDEX IF NOT EXISTS idx_partner_reviews_request_id ON public.partner_reviews(request_id);
CREATE INDEX IF NOT EXISTS idx_partner_reviews_reviewer_org_id ON public.partner_reviews(reviewer_org_id);
CREATE INDEX IF NOT EXISTS idx_partner_reviews_reviewee_org_id ON public.partner_reviews(reviewee_org_id);
CREATE INDEX IF NOT EXISTS idx_partner_reviews_rating ON public.partner_reviews(rating);

-- Grant permissions
GRANT ALL ON public.partner_reviews TO authenticated; 