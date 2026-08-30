-- ====================================================================
-- SUPABASE REALTIME & ROW LEVEL SECURITY (RLS) MIGRATION SCRIPT
-- ====================================================================

-- 1. Enable Row Level Security (RLS) on core business tables
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they already exist to avoid duplicate errors
DROP POLICY IF EXISTS "Allow select on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow insert on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow update on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow delete on invoices" ON public.invoices;

DROP POLICY IF EXISTS "Allow select on invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow insert on invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow update on invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow delete on invoice_items" ON public.invoice_items;

DROP POLICY IF EXISTS "Allow select on products" ON public.products;
DROP POLICY IF EXISTS "Allow insert on products" ON public.products;
DROP POLICY IF EXISTS "Allow update on products" ON public.products;

DROP POLICY IF EXISTS "Allow select on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow insert on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow update on customers" ON public.customers;

-- 3. Create RLS Policies for Invoices
CREATE POLICY "Allow select on invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow insert on invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on invoices" ON public.invoices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on invoices" ON public.invoices FOR DELETE USING (true);

-- 4. Create RLS Policies for Invoice Items
CREATE POLICY "Allow select on invoice_items" ON public.invoice_items FOR SELECT USING (true);
CREATE POLICY "Allow insert on invoice_items" ON public.invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on invoice_items" ON public.invoice_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on invoice_items" ON public.invoice_items FOR DELETE USING (true);

-- 5. Create RLS Policies for Products and Customers
CREATE POLICY "Allow select on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow insert on products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow select on customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow insert on customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on customers" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);

-- 6. Configure Supabase Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 7. Add tables to supabase_realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_items;
EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
END $$;

-- 8. Set REPLICA IDENTITY FULL for complete row payloads during realtime broadcast
ALTER TABLE IF EXISTS public.invoices REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.invoice_items REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.products REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.customers REPLICA IDENTITY FULL;
