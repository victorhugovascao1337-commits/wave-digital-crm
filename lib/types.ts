export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'missed' | 'cancelled'

export interface Patient {
  id: string
  name: string
  phone: string
  email: string | null
  service: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  patient?: Patient
  date: string
  start_time: string
  end_time: string
  duration: number
  service: string
  price: number
  status: AppointmentStatus
  notes: string | null
  created_at: string
}

export interface AppointmentFormData {
  patient_id: string
  date: string
  start_time: string
  duration: number
  service: string
  price: number
  notes: string
  professional: string
}

export const PROFESSIONALS = [
  'Dr. Ricardo Lopes',
  'Dra. Ana Ferreira',
]

export const statusColors: Record<AppointmentStatus, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-emerald-500', text: 'text-white', label: 'Concluído' },
  confirmed: { bg: 'bg-blue-500', text: 'text-white', label: 'Confirmado' },
  pending: { bg: 'bg-amber-500', text: 'text-white', label: 'Pendente' },
  missed: { bg: 'bg-red-500', text: 'text-white', label: 'Faltou' },
  cancelled: { bg: 'bg-gray-400', text: 'text-white', label: 'Cancelado' },
}

export const statusColorsBorder: Record<AppointmentStatus, string> = {
  completed: 'border-l-emerald-500 bg-emerald-50',
  confirmed: 'border-l-blue-500 bg-blue-50',
  pending: 'border-l-amber-500 bg-amber-50',
  missed: 'border-l-red-500 bg-red-50',
  cancelled: 'border-l-gray-400 bg-gray-50',
}

export const SERVICES_BY_TYPE: Record<string, string[]> = {
  fisioterapia: [
    'Fisioterapia Ortopédica',
    'Fisioterapia Neurológica',
    'Fisioterapia Traumato-Ortopédica',
    'Reabilitação Esportiva',
    'Pilates Terapêutico',
  ],
  odontologia: [
    'Limpeza e Profilaxia',
    'Restauração Dentária',
    'Tratamento de Canal',
    'Extração Dentária',
    'Clareamento Dental',
    'Implante Dentário',
    'Ortodontia',
    'Prótese Dentária',
    'Periodontia',
    'Cirurgia Oral',
  ],
  psicologia: [
    'Terapia Individual',
    'Terapia de Casal',
    'Terapia Familiar',
    'Avaliação Psicológica',
    'Terapia Cognitivo-Comportamental',
    'Psicoterapia Breve',
  ],
  estetica: [
    'Limpeza de Pele',
    'Peeling',
    'Drenagem Linfática',
    'Massagem Modeladora',
    'Radiofrequência',
    'Criolipólise',
    'Depilação a Laser',
  ],
  nutricao: [
    'Consulta Nutricional',
    'Reeducação Alimentar',
    'Dieta Terapêutica',
    'Avaliação Corporal',
    'Acompanhamento Nutricional',
  ],
  clinica_geral: [
    'Consulta Geral',
    'Check-up',
    'Exame Clínico',
    'Acompanhamento',
    'Retorno',
  ],
  pilates: [
    'Pilates Solo',
    'Pilates Aparelho',
    'Pilates Terapêutico',
    'Pilates para Gestantes',
    'Avaliação Postural',
  ],
  fonoaudiologia: [
    'Avaliação Fonoaudiológica',
    'Terapia de Fala',
    'Terapia de Linguagem',
    'Audiometria',
    'Motricidade Orofacial',
  ],
  acupuntura: [
    'Sessão de Acupuntura',
    'Auriculoterapia',
    'Ventosaterapia',
    'Moxabustão',
    'Eletroacupuntura',
  ],
  quiropraxia: [
    'Ajuste Quiroprático',
    'Avaliação Postural',
    'Terapia Manual',
    'Descompressão Vertebral',
    'Mobilização Articular',
  ],
}

// Default services for backward compatibility
export const SERVICES = SERVICES_BY_TYPE.fisioterapia

export const CLINIC_TYPE_LABELS: Record<string, string> = {
  fisioterapia: 'Fisioterapeuta',
  odontologia: 'Dentista',
  psicologia: 'Psicólogo(a)',
  estetica: 'Esteticista',
  nutricao: 'Nutricionista',
  clinica_geral: 'Clínico(a) Geral',
  pilates: 'Instrutor(a) de Pilates',
  fonoaudiologia: 'Fonoaudiólogo(a)',
  acupuntura: 'Acupunturista',
  quiropraxia: 'Quiropraxista',
}

export const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
]

export const WORK_HOURS = { start: 8, end: 19 }

export const TIME_SLOTS = Array.from(
  { length: (WORK_HOURS.end - WORK_HOURS.start) * 2 },
  (_, i) => {
    const hour = Math.floor(i / 2) + WORK_HOURS.start
    const minute = (i % 2) * 30
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
)
