-- Update classes.status to the new lifecycle:
-- active  = visible/usable on the web
-- deleted = hidden from the web, row preserved for FK/history

UPDATE public.classes
SET status = 'active'
WHERE status IS NULL OR status NOT IN ('active', 'deleted');

ALTER TABLE public.classes
DROP CONSTRAINT IF EXISTS chk_classes_status;

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'classes'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.classes
ADD CONSTRAINT chk_classes_status
CHECK (status::text = ANY (ARRAY['active'::character varying, 'deleted'::character varying]::text[]));
