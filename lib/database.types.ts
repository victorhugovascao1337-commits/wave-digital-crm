export interface Patient {
  id: string
  name: string
  phone: string
  email: string | null
  cpf: string | null
  birth_date: string | null
  notes: string | null
  status: 'active' | 'inactive' | 'pending'
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
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
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
  due_date: string
  paid_date: string | null
  status: 'paid' | 'pending' | 'overdue'
  payment_method: string | null
  created_at: string
  updated_at: string
  appointment?: Appointment
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

export interface PatientWithRelations extends Patient {
  appointments: Appointment[]
  payments: Payment[]
  medical_records: MedicalRecord[]
  anamnesis: Anamnesis | null
}
