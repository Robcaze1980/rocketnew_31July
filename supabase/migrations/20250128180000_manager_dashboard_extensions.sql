-- Location: supabase/migrations/20250128180000_manager_dashboard_extensions.sql
-- Schema Analysis: Extension to existing auto sales commission system
-- Integration Type: Extension - adding manager relationships and dashboard features
-- Dependencies: Existing user_profiles, sales tables from 20250128172400_auto_sales_commission_system.sql

-- 1. Add manager relationship to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- 2. Create index for manager queries
CREATE INDEX idx_user_profiles_manager_id ON public.user_profiles(manager_id);

-- 3. Create goals table for tracking department goals
CREATE TABLE public.department_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('revenue', 'sales', 'commissions')),
    target_amount DECIMAL(10,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manager_id, goal_type, period_start, period_end)
);

-- 4. Create indexes for goals table
CREATE INDEX idx_department_goals_manager_id ON public.department_goals(manager_id);
CREATE INDEX idx_department_goals_period ON public.department_goals(period_start, period_end);

-- 5. Enable RLS for goals table
ALTER TABLE public.department_goals ENABLE ROW LEVEL SECURITY;

-- 6. Create helper function for manager team access
CREATE OR REPLACE FUNCTION public.is_team_manager(team_member_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = team_member_id 
    AND (up.manager_id = auth.uid() OR auth.uid() = team_member_id)
) OR public.is_admin();
$$;

-- 7. Create RLS policies for goals
CREATE POLICY "managers_manage_own_goals" ON public.department_goals FOR ALL
USING (
    manager_id = auth.uid() OR 
    public.is_admin()
) WITH CHECK (
    manager_id = auth.uid() OR 
    public.is_admin()
);

-- 8. Update sales RLS policy to include manager access
DROP POLICY IF EXISTS "users_manage_own_sales" ON public.sales;

CREATE POLICY "users_and_managers_access_sales" ON public.sales FOR ALL
USING (
    salesperson_id = auth.uid() OR 
    sales_partner_id = auth.uid() OR 
    public.is_team_manager(salesperson_id) OR
    public.is_admin()
) WITH CHECK (
    salesperson_id = auth.uid() OR 
    public.is_team_manager(salesperson_id) OR
    public.is_admin()
);

-- 9. Update activity log RLS policy for manager access
DROP POLICY IF EXISTS "users_own_activity" ON public.activity_log;

CREATE POLICY "users_and_managers_access_activity" ON public.activity_log FOR ALL
USING (
    user_id = auth.uid() OR 
    public.is_team_manager(user_id) OR
    public.is_admin()
) WITH CHECK (
    user_id = auth.uid() OR 
    public.is_team_manager(user_id) OR
    public.is_admin()
);

-- 10. Create trigger for goals table updated_at
CREATE TRIGGER update_department_goals_updated_at
    BEFORE UPDATE ON public.department_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Insert sample manager relationships and goals
DO $$
DECLARE
    manager_uuid UUID;
    team_member1_uuid UUID;
    team_member2_uuid UUID;
BEGIN
    -- Get existing user IDs for manager relationship
    SELECT id INTO manager_uuid FROM public.user_profiles WHERE role = 'admin' LIMIT 1;
    SELECT id INTO team_member1_uuid FROM public.user_profiles WHERE role = 'member' AND full_name LIKE '%John%' LIMIT 1;
    SELECT id INTO team_member2_uuid FROM public.user_profiles WHERE role = 'member' AND full_name LIKE '%Jane%' LIMIT 1;

    -- Set up manager relationships if users exist
    IF manager_uuid IS NOT NULL AND team_member1_uuid IS NOT NULL THEN
        UPDATE public.user_profiles 
        SET manager_id = manager_uuid 
        WHERE id = team_member1_uuid;
    END IF;

    IF manager_uuid IS NOT NULL AND team_member2_uuid IS NOT NULL THEN
        UPDATE public.user_profiles 
        SET manager_id = manager_uuid 
        WHERE id = team_member2_uuid;
    END IF;

    -- Insert sample goals for current month if manager exists
    IF manager_uuid IS NOT NULL THEN
        INSERT INTO public.department_goals (manager_id, goal_type, target_amount, period_start, period_end)
        VALUES
            (manager_uuid, 'revenue', 150000.00, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
            (manager_uuid, 'sales', 50, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
            (manager_uuid, 'commissions', 15000.00, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
        ON CONFLICT (manager_id, goal_type, period_start, period_end) DO NOTHING;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Sample data setup error: %', SQLERRM;
END $$;