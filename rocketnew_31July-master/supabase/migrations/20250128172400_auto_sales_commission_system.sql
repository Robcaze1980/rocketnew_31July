-- Location: supabase/migrations/20250128172400_auto_sales_commission_system.sql
-- Schema Analysis: Complete Auto Sales Commission Dashboard System
-- Integration Type: New complete system
-- Dependencies: auth.users (Supabase managed)

-- 1. Create custom types
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'member');
CREATE TYPE public.vehicle_type AS ENUM ('new', 'used');
CREATE TYPE public.sale_status AS ENUM ('pending', 'completed', 'cancelled');

-- 2. Create user profiles table as intermediary
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    employee_id TEXT UNIQUE,
    phone TEXT,
    start_date DATE,
    role public.user_role DEFAULT 'member'::public.user_role,
    profile_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create sales table
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salesperson_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    stock_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    vehicle_type public.vehicle_type NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    sale_date DATE DEFAULT CURRENT_DATE,
    
    -- Commission components
    accessories_value DECIMAL(10,2) DEFAULT 0,
    warranty_selling_price DECIMAL(10,2) DEFAULT 0,
    warranty_cost DECIMAL(10,2) DEFAULT 0,
    service_price DECIMAL(10,2) DEFAULT 0,
    service_cost DECIMAL(10,2) DEFAULT 0,
    spiff_bonus DECIMAL(10,2) DEFAULT 0,
    spiff_comments TEXT,
    spiff_proof_url TEXT,
    
    -- Calculated commissions
    commission_sale DECIMAL(10,2) DEFAULT 0,
    commission_accessories DECIMAL(10,2) DEFAULT 0,
    commission_warranty DECIMAL(10,2) DEFAULT 0,
    commission_service DECIMAL(10,2) DEFAULT 0,
    commission_total DECIMAL(10,2) GENERATED ALWAYS AS (
        commission_sale + commission_accessories + commission_warranty + commission_service + spiff_bonus
    ) STORED,
    
    -- Shared sale info
    is_shared_sale BOOLEAN DEFAULT false,
    sales_partner_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    
    -- AI analysis results
    warranty_screenshot_url TEXT,
    service_screenshot_url TEXT,
    
    status public.sale_status DEFAULT 'pending'::public.sale_status,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create activity log table
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create essential indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_employee_id ON public.user_profiles(employee_id);
CREATE INDEX idx_sales_salesperson_id ON public.sales(salesperson_id);
CREATE INDEX idx_sales_stock_number ON public.sales(stock_number);
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_sales_partner_id ON public.sales(sales_partner_id);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_sale_id ON public.activity_log(sale_id);

-- 6. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 7. Create helper functions for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
)
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'manager')
)
$$;

CREATE OR REPLACE FUNCTION public.owns_sale(sale_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_uuid AND (
        s.salesperson_id = auth.uid() OR 
        s.sales_partner_id = auth.uid() OR
        public.is_manager_or_admin()
    )
)
$$;

-- 8. Create RLS policies
CREATE POLICY "users_own_profile" ON public.user_profiles FOR ALL
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "admins_manage_all_profiles" ON public.user_profiles FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "users_manage_own_sales" ON public.sales FOR ALL
USING (
    salesperson_id = auth.uid() OR 
    sales_partner_id = auth.uid() OR 
    public.is_manager_or_admin()
) WITH CHECK (
    salesperson_id = auth.uid() OR 
    public.is_manager_or_admin()
);

CREATE POLICY "users_own_activity" ON public.activity_log FOR ALL
USING (
    user_id = auth.uid() OR 
    public.is_manager_or_admin()
) WITH CHECK (
    user_id = auth.uid() OR 
    public.is_manager_or_admin()
);

-- 9. Create functions for automatic profile creation and activity logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'member'::public.user_role)
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_log (user_id, action, details, sale_id)
        VALUES (
            NEW.salesperson_id,
            'Sale Created',
            'New sale for ' || NEW.customer_name || ' - Stock #' || NEW.stock_number,
            NEW.id
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.activity_log (user_id, action, details, sale_id)
        VALUES (
            NEW.salesperson_id,
            'Sale Updated',
            'Updated sale for ' || NEW.customer_name || ' - Stock #' || NEW.stock_number,
            NEW.id
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- 10. Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER log_sale_activity
    AFTER INSERT OR UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- 11. Create commission calculation functions
CREATE OR REPLACE FUNCTION public.calculate_sale_commission(sale_price_param DECIMAL)
RETURNS DECIMAL
LANGUAGE sql
IMMUTABLE
AS $$
SELECT CASE
    WHEN sale_price_param >= 30000 THEN 500
    WHEN sale_price_param >= 20000 THEN 400
    WHEN sale_price_param >= 10000 THEN 300
    WHEN sale_price_param > 0 THEN 200
    ELSE 0
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_accessories_commission(
    accessories_value_param DECIMAL, 
    vehicle_type_param public.vehicle_type
)
RETURNS DECIMAL
LANGUAGE sql
IMMUTABLE
AS $$
SELECT CASE
    WHEN vehicle_type_param = 'new' THEN
        CASE WHEN accessories_value_param > 998 THEN
            FLOOR((accessories_value_param - 998) / 998) * 100
        ELSE 0 END
    ELSE
        FLOOR(accessories_value_param / 850) * 100
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_profit_commission(profit_param DECIMAL)
RETURNS DECIMAL
LANGUAGE sql
IMMUTABLE
AS $$
SELECT GREATEST(0, FLOOR(profit_param / 900) * 100);
$$;

-- 12. Create commission calculation trigger
CREATE OR REPLACE FUNCTION public.calculate_commissions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Calculate sale commission
    NEW.commission_sale := public.calculate_sale_commission(NEW.sale_price);
    
    -- Calculate accessories commission
    NEW.commission_accessories := public.calculate_accessories_commission(NEW.accessories_value, NEW.vehicle_type);
    
    -- Calculate warranty commission (based on profit)
    NEW.commission_warranty := public.calculate_profit_commission(NEW.warranty_selling_price - NEW.warranty_cost);
    
    -- Calculate service commission (based on profit)
    NEW.commission_service := public.calculate_profit_commission(NEW.service_price - NEW.service_cost);
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_sale_commissions
    BEFORE INSERT OR UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.calculate_commissions();

-- 13. Create storage buckets (handled by Supabase dashboard, but documented here)
-- Bucket: profile-photos (for user profile pictures)
-- Bucket: spiff-proofs (for SPIFF bonus documentation)
-- Bucket: sale-screenshots (for warranty and service screenshots)

-- 14. Mock data for development
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    user1_uuid UUID := gen_random_uuid();
    user2_uuid UUID := gen_random_uuid();
    sale1_uuid UUID := gen_random_uuid();
    sale2_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users with required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@dealership.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Admin User", "role": "admin"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'john.doe@dealership.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "John Doe", "role": "member"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'jane.smith@dealership.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Jane Smith", "role": "member"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create sales records
    INSERT INTO public.sales (
        id, salesperson_id, stock_number, customer_name, vehicle_type, sale_price,
        accessories_value, warranty_selling_price, warranty_cost, service_price, service_cost,
        spiff_bonus, is_shared_sale, sales_partner_id, status
    ) VALUES
        (sale1_uuid, user1_uuid, 'STK2025001', 'Michael Johnson', 'new'::public.vehicle_type, 32500.00,
         1200.00, 2500.00, 1800.00, 800.00, 600.00, 150.00, false, null, 'completed'::public.sale_status),
        (sale2_uuid, user2_uuid, 'STK2025002', 'Sarah Williams', 'used'::public.vehicle_type, 18500.00,
         850.00, 1800.00, 1200.00, 600.00, 400.00, 0.00, true, user1_uuid, 'completed'::public.sale_status);

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error: %', SQLERRM;
END $$;