-- ============================================
-- Auth Sync Migration V2 — Identity Fortress
-- ============================================

-- Force profile creation from auth.users (Standard Supabase Pattern)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  _role TEXT;
  _full_name TEXT;
  _avatar_url TEXT;
BEGIN
  -- 1. Extract Role from metadata (default: CLIENTE)
  _role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'CLIENTE'
  );

  -- 2. Extract Name from metadata (e.g. Google full_name or user_metadata.name)
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- 3. Extract Avatar URL for social logins
  _avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  -- 4. Upsert Profile
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    _full_name,
    _role::public.user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();

  -- 5. Auto-create provider profile if role is PROVEEDOR
  IF (_role = 'PROVEEDOR') THEN
    INSERT INTO public.provider_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Prevent blocking auth creation even if profile fails
    RAISE WARNING '[AUTH SYNC ERROR] Failed to sync profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Create Update Trigger (for metadata changes on repeat logins)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_new_auth_user();
