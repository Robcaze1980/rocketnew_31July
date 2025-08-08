-- Location: supabase/migrations/20250129000000_fix_manager_id_column.sql
-- Schema Analysis: Fix manager_id column conflict in user_profiles
-- Integration Type: Schema correction
-- Dependencies: Existing user_profiles table

-- Safely add manager_id column if it doesn't exist
DO $$
BEGIN
    -- Check if manager_id column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'manager_id'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added manager_id column to user_profiles table';
    ELSE
        RAISE NOTICE 'manager_id column already exists in user_profiles table';
    END IF;
    
    -- Ensure foreign key constraint exists if column was already present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = 'user_profiles'
        AND kcu.column_name = 'manager_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Add foreign key constraint if it doesn't exist
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT fk_user_profiles_manager_id 
        FOREIGN KEY (manager_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint for manager_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for manager_id already exists';
    END IF;
    
    -- Create index for manager_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_profiles' 
        AND indexname = 'idx_user_profiles_manager_id'
    ) THEN
        CREATE INDEX idx_user_profiles_manager_id ON public.user_profiles(manager_id);
        RAISE NOTICE 'Created index for manager_id column';
    ELSE
        RAISE NOTICE 'Index for manager_id already exists';
    END IF;
    
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'manager_id column already exists, skipping creation';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
END $$;

-- Create or update helper function for manager access
CREATE OR REPLACE FUNCTION public.is_manager_of_user(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = user_uuid 
    AND up.manager_id = auth.uid()
)
$$;

-- Create or update helper function to check if user is a manager
CREATE OR REPLACE FUNCTION public.has_team_members()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.manager_id = auth.uid()
)
$$;

-- Update RLS policies to include manager access
DROP POLICY IF EXISTS "users_own_profile" ON public.user_profiles;
CREATE POLICY "users_own_profile_and_manager_access" ON public.user_profiles 
FOR SELECT
TO authenticated
USING (
    auth.uid() = id OR 
    manager_id = auth.uid() OR 
    public.is_admin()
);

CREATE POLICY "users_update_own_profile" ON public.user_profiles 
FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "users_insert_own_profile" ON public.user_profiles 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Update sales policies to include manager access for team members
DROP POLICY IF EXISTS "users_manage_own_sales" ON public.sales;
CREATE POLICY "users_and_managers_access_sales" ON public.sales 
FOR SELECT
TO authenticated
USING (
    salesperson_id = auth.uid() OR 
    sales_partner_id = auth.uid() OR 
    public.is_manager_or_admin() OR
    public.is_manager_of_user(salesperson_id)
);

CREATE POLICY "users_manage_own_sales_insert" ON public.sales 
FOR INSERT
TO authenticated
WITH CHECK (
    salesperson_id = auth.uid() OR 
    public.is_manager_or_admin()
);

CREATE POLICY "users_manage_own_sales_update" ON public.sales 
FOR UPDATE
TO authenticated
USING (
    salesperson_id = auth.uid() OR 
    sales_partner_id = auth.uid() OR 
    public.is_manager_or_admin() OR
    public.is_manager_of_user(salesperson_id)
)
WITH CHECK (
    salesperson_id = auth.uid() OR 
    public.is_manager_or_admin()
);

CREATE POLICY "users_delete_own_sales" ON public.sales 
FOR DELETE
TO authenticated
USING (
    salesperson_id = auth.uid() OR 
    public.is_manager_or_admin()
);