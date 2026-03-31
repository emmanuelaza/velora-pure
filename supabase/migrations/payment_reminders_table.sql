-- Create payment_reminders table
create table if not exists public.payment_reminders (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade null,
  channel text not null, -- 'email', 'whatsapp'
  amount numeric not null,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on row level security
alter table public.payment_reminders enable row level security;

-- Policies
create policy "Businesses can view their own reminders"
  on payment_reminders for select
  using ( auth.uid() = business_id );

create policy "Businesses can insert their own reminders"
  on payment_reminders for insert
  with check ( auth.uid() = business_id );
