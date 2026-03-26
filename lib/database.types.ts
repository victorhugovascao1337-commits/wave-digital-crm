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

export interface PatientWithRelations extends Patient {
  appointments: Appointment[]
  payments: Payment[]
}
