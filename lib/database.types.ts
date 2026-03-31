export interface Patient {
  id: string
  name: string
  phone: string
  email: string | null
  cpf: string | null
  birth_date: string | null
  notes: string | null
  status: string
  cep: string | null
  street: string | null
  street_number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  payment_type: string | null
  plan_name: string | null
  plan_sessions: number | null
  plan_value: number | null
  session_value: number | null
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  date: string
  start_time: string
  end_time: string
  service: string
  status: 'PENDENTE' | 'CONFIRMADO' | 'CONCLUÍDO' | 'FALTOU' | 'CANCELADO' | 'CHEGOU' | 'EM ATENDIMENTO' | 'BLOQUEADO'
  notes: string | null
  amount: number
  created_at: string
  updated_at: string
  patient?: Patient
}

export interface Payment {
  id: string
  patient_id: string
  appointment_id: string | null
  description: string
  amount: number
  due_date: string | null
  payment_date: string | null
  status: 'paid' | 'pending' | 'overdue'
  payment_method: string | null
  created_at: string
  updated_at: string
  patient?: { id: string; name: string; cpf: string | null; phone: string | null; email: string | null }
  appointment?: Appointment
}

export interface Expense {
  id: string
  category_id: string | null
  description: string
  amount: number
  expense_date: string
  payment_method: string | null
  status: 'paid' | 'pending' | 'overdue'
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly'
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  category?: FinancialCategory
}

export interface FinancialCategory {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  created_at: string
}

export interface MedicalRecord {
  id: string
  patient_id: string
  professional_id: string | null
  appointment_id: string | null
  record_type: 'consultation' | 'exam' | 'procedure' | 'prescription' | 'evolution' | 'other'
  title: string | null
  content: string | null
  diagnosis: string | null
  prescription: string | null
  attachments: string[]
  created_at: string
  updated_at: string
  patient?: Patient
}

export interface Anamnesis {
  id: string
  patient_id: string
  filled_by: string | null
  chief_complaint: string | null
  medical_history: string | null
  family_history: string | null
  allergies: string | null
  medications: string | null
  habits: string | null
  observations: string | null
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
  patient?: Patient
}

export interface ClinicalDocument {
  id: string
  patient_id: string
  professional_id: string | null
  document_type: 'prescription' | 'certificate_attendance' | 'certificate_medical' | 'referral'
  title: string | null
  content: string | null
  diagnosis: string | null
  cid_code: string | null
  days_off: number | null
  date_start: string | null
  date_end: string | null
  referred_to: string | null
  referred_specialty: string | null
  medications: Medication[]
  notes: string | null
  clinic_name: string | null
  clinic_address: string | null
  clinic_phone: string | null
  clinic_logo_url: string | null
  professional_name: string | null
  professional_credentials: string | null
  signature_image_url: string | null
  created_at: string
  updated_at: string
  patient?: Patient
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  default_price: number
  duration_minutes: number
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Commission {
  id: string
  professional_id: string
  payment_id: string
  percentage: number
  amount: number
  status: 'pending' | 'paid'
  paid_at: string | null
  created_at: string
}

export interface PatientWithRelations extends Patient {
  appointments: Appointment[]
  payments: Payment[]
  medical_records: MedicalRecord[]
  anamnesis: Anamnesis | null
}
