create table if not exists organization_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default 'EventHub',
  contact_email text not null default 'contacto@eventhub.cl',
  whatsapp_number text not null default '',
  legal_name text,
  legal_rut text,
  bank_name text,
  account_type text,
  account_number text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table organization_settings enable row level security;

-- Policy: Allow read access to everyone (public settings)
create policy "Allow public read access" on organization_settings for select using (true);

-- Policy: Allow update only to admins
create policy "Allow update only for admins" on organization_settings for update using (
  auth.uid() in (select id from profiles where role = 'ADMIN')
);

-- Insert default row singleton
insert into organization_settings (id, company_name, contact_email, whatsapp_number, legal_name, legal_rut, bank_name, account_type, account_number)
select 
  '00000000-0000-0000-0000-000000000000', 
  'EventHub', 
  'inversionsanagustin@gmail.com', 
  '+56942811743', 
  'INVERSIONES SAN AGUSTIN SpA', 
  '77.764.529-3', 
  'Banco de Chile', 
  'Cuenta Corriente', 
  '00-164-32402-10'
where not exists (select 1 from organization_settings);
