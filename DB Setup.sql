-- #############################################
-- #       SCHEMA FOR i-ContainerHub@LTA       #
-- #                 #
-- #############################################

-- ========= 1. TẠO CÁC LOẠI (ENUM TYPES) =========
-- Đảm bảo bạn chạy phần này trước nếu chưa tạo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_type') THEN
        CREATE TYPE public.organization_type AS ENUM ('TRUCKING_COMPANY', 'SHIPPING_LINE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('DISPATCHER', 'CARRIER_ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE public.request_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
        CREATE TYPE public.asset_status AS ENUM ('AVAILABLE', 'AWAITING_APPROVAL', 'CONFIRMED');
    END IF;
END$$;


-- ========= 2. TẠO CÁC BẢNG  =========



-- BẢNG `organizations`
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    type public.organization_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BẢNG `profiles`
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    role public.user_role NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- BẢNG `import_containers`
CREATE TABLE public.import_containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_number TEXT NOT NULL,
    container_type TEXT NOT NULL,
    drop_off_location TEXT NOT NULL,
    available_from_datetime TIMESTAMPTZ NOT NULL,
    trucking_company_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    shipping_line_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    status public.asset_status NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BẢNG `export_bookings`
CREATE TABLE public.export_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number TEXT NOT NULL,
    required_container_type TEXT NOT NULL,
    pick_up_location TEXT NOT NULL,
    needed_by_datetime TIMESTAMPTZ NOT NULL,
    trucking_company_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    status public.asset_status NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BẢNG `street_turn_requests`
CREATE TABLE public.street_turn_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_container_id UUID NOT NULL REFERENCES public.import_containers(id) ON DELETE CASCADE,
    export_booking_id UUID NOT NULL REFERENCES public.export_bookings(id) ON DELETE CASCADE,
    requesting_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    approving_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    status public.request_status NOT NULL DEFAULT 'PENDING',
    estimated_cost_saving NUMERIC,
    estimated_co2_saving_kg NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- #############################################
-- #             DATABASE TRIGGERS             #
-- #############################################

-- ========= TRIGGER: AUTO-CREATE PROFILE WHEN USER SIGNS UP =========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, organization_id, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'organization_id')::uuid,
    (NEW.raw_user_meta_data->>'role')::public.user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- #############################################
-- #        ROW LEVEL SECURITY (RLS)           #
-- #                         #
-- #############################################

-- ========= 1. TẠO HÀM HELPER TRONG SCHEMA `public` =========
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========= 2. BẬT RLS VÀ TẠO CÁC CHÍNH SÁCH (POLICIES) =========

-- Bảng `organizations`:
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
USING (id = public.get_current_org_id());

-- Bảng `profiles`:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;
CREATE POLICY "Users can view and update their own profile"
ON public.profiles FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Bảng `import_containers`:
ALTER TABLE public.import_containers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trucking companies can manage their own import containers" ON public.import_containers;
CREATE POLICY "Trucking companies can manage their own import containers"
ON public.import_containers FOR ALL
USING (trucking_company_org_id = public.get_current_org_id())
WITH CHECK (trucking_company_org_id = public.get_current_org_id());

-- Bảng `export_bookings`:
ALTER TABLE public.export_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trucking companies can manage their own export bookings" ON public.export_bookings;
CREATE POLICY "Trucking companies can manage their own export bookings"
ON public.export_bookings FOR ALL
USING (trucking_company_org_id = public.get_current_org_id())
WITH CHECK (trucking_company_org_id = public.get_current_org_id());

-- Bảng `street_turn_requests`:
ALTER TABLE public.street_turn_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Involved parties can view requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Trucking companies can create requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Shipping lines can update (approve/decline) requests" ON public.street_turn_requests;

CREATE POLICY "Involved parties can view requests"
ON public.street_turn_requests FOR SELECT
USING (
  (requesting_org_id = public.get_current_org_id()) OR (approving_org_id = public.get_current_org_id())
);

CREATE POLICY "Trucking companies can create requests"
ON public.street_turn_requests FOR INSERT
WITH CHECK (requesting_org_id = public.get_current_org_id());

CREATE POLICY "Shipping lines can update (approve/decline) requests"
ON public.street_turn_requests FOR UPDATE
USING (approving_org_id = public.get_current_org_id());