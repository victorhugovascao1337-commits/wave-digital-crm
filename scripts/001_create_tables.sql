-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  service TEXT,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Pendente', 'Inativo')),
  avatar_color TEXT DEFAULT 'bg-teal-500',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- in minutes
  service TEXT NOT NULL,
  value DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('CONFIRMADO', 'PENDENTE', 'CONCLUÍDO', 'FALTOU', 'CANCELADO')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Disable RLS for now (can be enabled later with auth)
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Insert sample patients
INSERT INTO patients (id, name, initials, phone, service, status, avatar_color) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Maria Oliveira', 'MO', '(11) 99234-5678', 'Fisioterapia Traumato-Ortopédica', 'Ativo', 'bg-teal-500'),
  ('22222222-2222-2222-2222-222222222222', 'João Silva', 'JS', '(11) 98765-4321', 'Reabilitação Esportiva', 'Ativo', 'bg-emerald-500'),
  ('33333333-3333-3333-3333-333333333333', 'Ana Ferreira', 'AF', '(11) 91234-5678', 'Pilates Terapêutico', 'Ativo', 'bg-purple-500'),
  ('44444444-4444-4444-4444-444444444444', 'Roberto Costa', 'RC', '(11) 97654-3210', 'Fisioterapia Neurológica', 'Ativo', 'bg-cyan-500'),
  ('55555555-5555-5555-5555-555555555555', 'Pedro Mendes', 'PM', '(11) 95555-1234', 'Fisioterapia Ortopédica', 'Pendente', 'bg-orange-500'),
  ('66666666-6666-6666-6666-666666666666', 'Carla Lima', 'CL', '(11) 93333-9876', 'Reabilitação Esportiva', 'Ativo', 'bg-pink-500')
ON CONFLICT (id) DO NOTHING;

-- Insert sample appointments for today and nearby dates
INSERT INTO appointments (patient_id, date, start_time, end_time, duration, service, value, status) VALUES
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE, '09:00', '10:00', 60, 'Fisioterapia Traumato-Ortopédica', 150.00, 'CONCLUÍDO'),
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE, '10:30', '11:30', 60, 'Reabilitação Esportiva', 180.00, 'PENDENTE'),
  ('33333333-3333-3333-3333-333333333333', CURRENT_DATE, '14:00', '15:00', 60, 'Pilates Terapêutico', 150.00, 'CONFIRMADO'),
  ('44444444-4444-4444-4444-444444444444', CURRENT_DATE, '15:30', '16:30', 60, 'Fisioterapia Neurológica', 200.00, 'CONFIRMADO'),
  ('55555555-5555-5555-5555-555555555555', CURRENT_DATE + INTERVAL '1 day', '09:00', '10:00', 60, 'Fisioterapia Ortopédica', 150.00, 'PENDENTE'),
  ('66666666-6666-6666-6666-666666666666', CURRENT_DATE + INTERVAL '1 day', '11:00', '12:00', 60, 'Reabilitação Esportiva', 180.00, 'CONFIRMADO'),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE + INTERVAL '2 days', '10:00', '11:00', 60, 'Fisioterapia Traumato-Ortopédica', 150.00, 'PENDENTE'),
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '1 day', '09:00', '10:00', 60, 'Reabilitação Esportiva', 180.00, 'FALTOU')
ON CONFLICT DO NOTHING;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for payments
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Disable RLS for payments
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Insert sample payments
INSERT INTO payments (patient_id, description, amount, due_date, paid_date, status, payment_method) VALUES
  ('55555555-5555-5555-5555-555555555555', 'Sessão de fisioterapia', 150.00, CURRENT_DATE - INTERVAL '5 days', NULL, 'overdue', NULL),
  ('66666666-6666-6666-6666-666666666666', 'Reabilitação esportiva', 280.00, CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL),
  ('11111111-1111-1111-1111-111111111111', 'Fisioterapia ortopédica', 200.00, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '30 days', 'paid', 'PIX'),
  ('22222222-2222-2222-2222-222222222222', 'Plano mensal — 10 sessões', 750.00, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '14 days', 'paid', 'Cartão de Crédito')
ON CONFLICT DO NOTHING;
