-- CREATE TABLE IF NOT EXISTS quotes
CREATE TABLE IF NOT EXISTS quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  property_type text,
  bedrooms integer,
  bathrooms integer,
  sqft integer,
  clean_type text,
  frequency text,
  extras text[] DEFAULT '{}',
  base_price numeric,
  multiplier numeric,
  frequency_discount numeric,
  extras_total numeric,
  total_price numeric,
  duration_hours numeric,
  confidence_score integer,
  status text DEFAULT 'draft',
  notes text,
  conversation jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own quotes" ON quotes
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );
