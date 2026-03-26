export type AppointmentStatus = 'completed' | 'pending' | 'missed'

export interface DbPatient {
  id: string
  name: string
  phone: string | null
  email: string | null
  service: string | null
  status: string
  created_at: string
}

export interface DbAppointment {
  id: string
  patient_id: string
  date: string
  start_time: string
  end_time: string
  service: string
  status: AppointmentStatus
  value: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentWithPatient extends DbAppointment {
  patient: DbPatient
}

export interface CreateAppointmentInput {
  patient_id: string
  date: string
  start_time: string
  end_time: string
  service: string
  status?: AppointmentStatus
  value?: number
  notes?: string
}

export interface UpdateAppointmentInput {
  patient_id?: string
  date?: string
  start_time?: string
  end_time?: string
  service?: string
  status?: AppointmentStatus
  value?: number
  notes?: string
}
