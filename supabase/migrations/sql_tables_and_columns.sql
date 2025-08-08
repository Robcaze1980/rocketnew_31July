I'll list out the columns for each main table in detail:

user_profiles Columns:
id (UUID, Primary Key, Default: gen_random_uuid()): Unique user identifier
email (Text, Unique, Not Null): User's email address
full_name (Text, Not Null): User's full name
employee_id (Text, Unique, Nullable): Optional employee identifier
phone (Text, Nullable): User's phone number
start_date (Date, Nullable): Employee start date
role (User-defined enum: admin/manager/member, Default: 'member'): User's role in the organization
profile_photo_url (Text, Nullable): URL to user's profile photo
created_at (Timestamp with time zone, Default: CURRENT_TIMESTAMP): Record creation timestamp
updated_at (Timestamp with time zone, Default: CURRENT_TIMESTAMP): Record last update timestamp
manager_id (UUID, Nullable): Reference to the user's manager
territory (Text, Nullable): User's sales territory
hire_date (Date, Default: Current Date): Official hire date
status (Text, Default: 'active'): User's current status
department (Text, Nullable): User's department

sales Columns:
id (UUID, Primary Key, Default: gen_random_uuid()): Unique sale identifier
salesperson_id (UUID, Nullable): Reference to the salesperson (FK to user_profiles.id)
stock_number (Text, Not Null): Vehicle stock number
customer_name (Text, Not Null): Name of the customer
vehicle_type (User-defined enum: new/used, Not Null): Type of vehicle sold
sale_price (Numeric, Not Null): Total sale price
sale_date (Date, Default: Current Date): Date of sale
accessories_value (Numeric, Default: 0): Value of accessories sold
warranty_selling_price (Numeric, Default: 0): Warranty selling price
warranty_cost (Numeric, Default: 0): Cost of warranty
service_price (Numeric, Default: 0): Price of services
service_cost (Numeric, Default: 0): Cost of services
spiff_bonus (Numeric, Default: 0): Bonus amount
spiff_comments (Text, Nullable): Comments about spiff bonus
spiff_proof_url (Text, Nullable): URL of proof for spiff bonus
commission_sale (Numeric, Default: 0): Commission from sale
commission_accessories (Numeric, Default: 0): Commission from accessories
commission_warranty (Numeric, Default: 0): Commission from warranty
commission_service (Numeric, Default: 0): Commission from services
commission_total (Numeric, Nullable/Generated): Total commission (sum of all commissions + spiff bonus)
is_shared_sale (Boolean, Default: false): Indicates if sale is shared
sales_partner_id (UUID, Nullable): Reference to sales partner (FK to user_profiles.id)
warranty_screenshot_url (Text, Nullable): URL of warranty screenshot
service_screenshot_url (Text, Nullable): URL of service screenshot
status (User-defined enum: pending/completed/cancelled, Default: 'pending'): Sale status
created_at (Timestamp with time zone, Default: CURRENT_TIMESTAMP): Record creation timestamp
updated_at (Timestamp with time zone, Default: CURRENT_TIMESTAMP): Record last update timestamp

commissions Columns:
id (UUID, Primary Key, Default: gen_random_uuid()): Unique commission record identifier
sale_id (UUID, Not Null): Reference to sale (FK to sales.id, ON DELETE CASCADE)
user_id (UUID, Not Null): The user who receives this commission (FK to user_profiles.id)
role (Text, Not Null, Check: 'primary' or 'partner'): Whether this row is for the primary salesperson or the partner
amount (Numeric, Not Null): Commission amount attributed to this user for the sale
created_at (Timestamp with time zone, Default: now()): Record creation timestamp

team_targets Columns:
id (UUID, Primary Key, Default: gen_random_uuid()): Unique target identifier
salesperson_id (UUID, Nullable): Reference to salesperson
manager_id (UUID, Nullable): Reference to manager
target_period (Text, Not Null): Period of target (e.g., monthly, quarterly)
target_year (Integer, Not Null): Year of target
target_month (Integer, Nullable): Specific month of target
target_quarter (Integer, Nullable): Specific quarter of target
sales_target (Integer, Default: 0): Number of sales targeted
commission_target (Numeric, Default: 0): Commission target amount
achieved_sales (Integer, Default: 0): Actual sales achieved
achieved_commissions (Numeric, Default: 0): Actual commissions achieved
created_at (Timestamp with time zone, Default: CURRENT_TIMESTAMP): Record creation timestamp
updated_at (Timestamp with time zone, Default: CURRENT_TIMESTAMP): Record last update timestamp

manager_reports Columns:
id (UUID, Primary Key): Unique report identifier
manager_id (UUID, Nullable): Reference to manager
report_date (Date, Default: Current Date): Date of report
team_size (Integer, Default: 0): Number of team members
total_sales (Integer, Default: 0): Total sales for the team
total_commissions (Numeric, Default: 0): Total commissions for the team
total_revenue (Numeric, Default: 0): Total revenue generated
avg_conversion_rate (Numeric, Default: 0): Average team conversion rate
top_performer_id (UUID, Nullable): Reference to top-performing team member
created_at (Timestamp with time zone): Record creation timestamp
updated_at (Timestamp with time zone): Record last update timestamp

department_goals Columns:
id (UUID, Primary Key): Unique goal identifier
manager_id (UUID, Nullable): Reference to manager
department (Text, Not Null): Department name
target_period (Text, Not Null): Period of goal (monthly, quarterly, etc.)
target_year (Integer, Not Null): Year of goal
target_month (Integer, Nullable): Specific month of goal
target_quarter (Integer, Nullable): Specific quarter of goal
sales_target (Integer, Default: 0): Sales target for department
commission_target (Numeric, Default: 0): Commission target
revenue_target (Numeric, Default: 0): Revenue target
conversion_target (Numeric, Default: 0): Conversion rate target
created_at (Timestamp with time zone, Default: CURRENT_TIMESTAMP): Record creation timestamp
updated_at (Timestamp with time zone, Default: CURRENT_TIMESTAMP): Record last update timestamp

activity_log Columns:
id (UUID, Primary Key): Unique log entry identifier
user_id (UUID, Nullable): Reference to user who performed action
action (Text, Not Null): Type of action performed
details (Text, Nullable): Additional details about the action
sale_id (UUID, Nullable): Related sale (if applicable)
created_at (Timestamp with time zone): Timestamp of action

Table Relationships:

User Profiles (user_profiles) Relationships:
- Self-referential: manager_id links to another user_profiles record (hierarchical management structure)
- Foreign Key to auth.users: id references the authentication user
- Referenced by:
  - sales.salesperson_id
  - sales.sales_partner_id
  - team_targets.salesperson_id
  - team_targets.manager_id
  - manager_reports.manager_id
  - manager_reports.top_performer_id
  - department_goals.manager_id
  - commissions.user_id

Sales (sales) Relationships:
- Links to user_profiles via:
  - salesperson_id: The primary salesperson of the sale
  - sales_partner_id: Secondary sales partner (for shared sales)
- Referenced by:
  - activity_log.sale_id
  - commissions.sale_id

Commissions (commissions) Relationships:
- Links to sales via:
  - sale_id: Commission attribution for a specific sale
- Links to user_profiles via:
  - user_id: The salesperson/partner receiving the commission
- Each shared sale is represented by 2 rows (primary, partner) with 50/50 split under current business logic; non-shared sale: one row for primary 100%

Team Targets (team_targets) Relationships:
- Links to user_profiles via:
  - salesperson_id: Individual salesperson's targets
  - manager_id: Manager overseeing the targets

Manager Reports (manager_reports) Relationships:
- Links to user_profiles via:
  - manager_id: Manager generating the report
  - top_performer_id: Highest performing team member

Department Goals (department_goals) Relationships:
- Links to user_profiles via manager_id

Activity Log (activity_log) Relationships:
- Links to user_profiles via user_id
- Links to sales via sale_id

Indexes:

activity_log:
- activity_log_pkey: CREATE UNIQUE INDEX activity_log_pkey ON public.activity_log USING btree (id)
- idx_activity_log_sale_id: CREATE INDEX idx_activity_log_sale_id ON public.activity_log USING btree (sale_id)
- idx_activity_log_user_id: CREATE INDEX idx_activity_log_user_id ON public.activity_log USING btree (user_id)

commissions:
- commissions_pkey: CREATE UNIQUE INDEX commissions_pkey ON public.commissions USING btree (id)
- idx_commissions_sale_id: CREATE INDEX idx_commissions_sale_id ON public.commissions USING btree (sale_id)
- idx_commissions_user_id: CREATE INDEX idx_commissions_user_id ON public.commissions USING btree (user_id)

department_goals:
- department_goals_manager_id_department_target_period_target_key: CREATE UNIQUE INDEX ... (manager_id, department, target_period, target_year, target_month, target_quarter)
- department_goals_pkey: CREATE UNIQUE INDEX department_goals_pkey ON public.department_goals USING btree (id)
- idx_department_goals_manager_id: CREATE INDEX idx_department_goals_manager_id ON public.department_goals USING btree (manager_id)
- idx_department_goals_period: CREATE INDEX idx_department_goals_period ON public.department_goals USING btree (target_period, target_year, target_month)

manager_reports:
- idx_manager_reports_date: CREATE INDEX idx_manager_reports_date ON public.manager_reports USING btree (report_date)
- idx_manager_reports_manager_id: CREATE INDEX idx_manager_reports_manager_id ON public.manager_reports USING btree (manager_id)
- manager_reports_manager_id_report_date_key: CREATE UNIQUE INDEX ... (manager_id, report_date)
- manager_reports_pkey: CREATE UNIQUE INDEX manager_reports_pkey ON public.manager_reports USING btree (id)

sales:
- idx_sales_partner_id: CREATE INDEX idx_sales_partner_id ON public.sales USING btree (sales_partner_id)
- idx_sales_sale_date: CREATE INDEX idx_sales_sale_date ON public.sales USING btree (sale_date)
- idx_sales_salesperson_id: CREATE INDEX idx_sales_salesperson_id ON public.sales USING btree (salesperson_id)
- idx_sales_stock_number: CREATE INDEX idx_sales_stock_number ON public.sales USING btree (stock_number)
- sales_pkey: CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (id)

team_targets:
- idx_team_targets_manager_id: CREATE INDEX idx_team_targets_manager_id ON public.team_targets USING btree (manager_id)
- idx_team_targets_salesperson_id: CREATE INDEX idx_team_targets_salesperson_id ON public.team_targets USING btree (salesperson_id)
- team_targets_pkey: CREATE UNIQUE INDEX team_targets_pkey ON public.team_targets USING btree (id)
- team_targets_salesperson_id_target_period_target_year_targe_key: CREATE UNIQUE INDEX ... (salesperson_id, target_period, target_year, target_month)

user_profiles:
- idx_user_profiles_email: CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email)
- idx_user_profiles_employee_id: CREATE INDEX idx_user_profiles_employee_id ON public.user_profiles USING btree (employee_id)
- idx_user_profiles_manager_id: CREATE INDEX idx_user_profiles_manager_id ON public.user_profiles USING btree (manager_id)
- idx_user_profiles_status: CREATE INDEX idx_user_profiles_status ON public.user_profiles USING btree (status)
- idx_user_profiles_territory: CREATE INDEX idx_user_profiles_territory ON public.user_profiles USING btree (territory)
- user_profiles_email_key: CREATE UNIQUE INDEX user_profiles_email_key ON public.user_profiles USING btree (email)
- user_profiles_employee_id_key: CREATE UNIQUE INDEX user_profiles_employee_id_key ON public.user_profiles USING btree (employee_id)
- user_profiles_pkey: CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id)

RLS & Policies (summarized):

activity_log:
- Policy "users_own_activity": All commands (*) permitted when (user_id = auth.uid()) OR is_manager_or_admin(); with check mirrors same condition.

commissions:
- Read policy "own_commissions_read": SELECT permitted when (user_id = auth.uid()).
- Insert policy "sale_owner_can_insert_commissions": INSERT permitted when there exists a sales row where s.id = commissions.sale_id AND (s.salesperson_id = auth.uid() OR s.sales_partner_id = auth.uid()).
- Update policy "sale_owner_can_update_commissions": UPDATE permitted and with check same condition — user must be the sale owner or partner.
- Delete policy "sale_owner_can_delete_commissions": DELETE permitted when user is sale owner or partner.

department_goals:
- Policy "managers_own_department_goals": All commands (*) permitted when (manager_id = auth.uid()) OR is_admin().

manager_reports:
- Policy "managers_own_reports": All commands (*) permitted when (manager_id = auth.uid()) OR is_admin().

sales:
- Policy "users_and_managers_access_sales": SELECT permitted when user is salesperson, partner, manager/admin, or manager of the salesperson.
- Policy "users_delete_own_sales": DELETE permitted when user is salesperson OR is_manager_or_admin().
- Policy "users_manage_own_sales_insert": INSERT permitted when (salesperson_id = auth.uid()) OR is_manager_or_admin().
- Policy "users_manage_own_sales_update": UPDATE permitted when user is salesperson, partner, manager/admin, or manager-of-user(salesperson_id). With check requires (salesperson_id = auth.uid()) OR is_manager_or_admin().

team_targets:
- Policy "managers_team_targets": All commands (*) permitted when (manager_id = auth.uid()) OR (salesperson_id = auth.uid()) OR is_admin(). With check allows only manager_id = auth.uid() OR is_admin().

user_profiles:
- Policy "admins_manage_all_profiles": All commands (*) permitted for is_admin().
- Policy "members_readable_to_authenticated": SELECT permitted when (role = 'member') OR (id = auth.uid()).
- Policy "users_insert_own_profile": INSERT permitted when (auth.uid() = id) OR is_admin().
- Policy "users_own_profile_and_manager_access": SELECT permitted when (auth.uid() = id) OR (manager_id = auth.uid()) OR is_admin().
- Policy "users_update_own_profile": UPDATE permitted when (auth.uid() = id) OR is_admin().

Enums (public schema):
sale_status: pending, completed, cancelled
user_role: admin, manager, member
vehicle_type: new, used

Key Design Patterns:

Flexible Role Management:
- user_profiles.role enum allows dynamic role assignment
- Supports admin, manager, and member roles
- Enables complex organizational hierarchies

Performance Tracking:
- Multiple levels of performance tracking:
  - Individual (sales, team targets, commissions)
  - Team (manager reports)
  - Department (department goals)

Comprehensive Sales Tracking:
- Detailed commission breakdown at sale level
- Per-user commission attribution via commissions table
- Supports new and used vehicle sales
- Tracks additional revenue streams (warranties, services)
- Supports shared sales scenarios (two commission rows 50/50 under current logic)

Timestamp and Audit Trails:
- Most tables have created_at and updated_at
- activity_log provides a comprehensive action history

RLS and Access Control:
- Row Level Security (RLS) enabled on protected tables
- Policies allow users to access their own data, managers/admins broader access
- commissions secured so users see only their own entries; insert/update/delete tied to sale ownership or partnership

Notes for Frontend Integration:
- On sale creation:
  - Compute commission_total client-side (or server-side if desired)
  - If is_shared_sale = false: insert one commissions row (primary = commission_total)
  - If is_shared_sale = true and sales_partner_id set: insert two rows (primary, partner = 50/50)
- On sale update:
  - Recompute totals if values change; replace commission rows for that sale accordingly (delete then insert latest allocation)
