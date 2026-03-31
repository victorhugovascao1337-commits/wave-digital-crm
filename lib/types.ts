export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'missed' | 'cancelled' | 'arrived' | 'in_progress'

export type ViewMode = 'day' | 'week' | 'month'

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
  professional?: string | null
  recurrence?: string | null
  is_block?: boolean
  block_reason?: string | null
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
  recurrence?: string
  is_block?: boolean
  block_reason?: string
}

export const PROFESSIONALS = [
  'Dr. Ricardo Lopes',
  'Dra. Ana Ferreira',
]

export const statusColors: Record<AppointmentStatus, { bg: string; text: string; label: string }> = {
  pending:     { bg: 'bg-amber-500',   text: 'text-white', label: 'Pendente' },
  confirmed:   { bg: 'bg-blue-500',    text: 'text-white', label: 'Confirmado' },
  arrived:     { bg: 'bg-indigo-500',  text: 'text-white', label: 'Chegou' },
  in_progress: { bg: 'bg-violet-500',  text: 'text-white', label: 'Atendendo' },
  completed:   { bg: 'bg-emerald-500', text: 'text-white', label: 'Concluído' },
  missed:      { bg: 'bg-red-500',     text: 'text-white', label: 'Faltou' },
  cancelled:   { bg: 'bg-gray-400',    text: 'text-white', label: 'Cancelado' },
}

export const statusColorsBorder: Record<AppointmentStatus, string> = {
  pending:     'border-l-amber-500 bg-amber-50',
  confirmed:   'border-l-blue-500 bg-blue-50',
  arrived:     'border-l-indigo-500 bg-indigo-50',
  in_progress: 'border-l-violet-500 bg-violet-50',
  completed:   'border-l-emerald-500 bg-emerald-50',
  missed:      'border-l-red-500 bg-red-50',
  cancelled:   'border-l-gray-400 bg-gray-50',
}

// Status flow: defines which transitions are valid
export const STATUS_FLOW: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['arrived', 'missed', 'cancelled'],
  arrived:     ['in_progress', 'missed'],
  in_progress: ['completed'],
  completed:   [],
  missed:      ['pending'],
  cancelled:   ['pending'],
}

// Service colors for visual coding in the calendar
export const SERVICE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Limpeza e Profilaxia':   { bg: 'bg-sky-50',     border: 'border-l-sky-500',     text: 'text-sky-700' },
  'Restauração Dentária':   { bg: 'bg-amber-50',   border: 'border-l-amber-500',   text: 'text-amber-700' },
  'Tratamento de Canal':    { bg: 'bg-red-50',      border: 'border-l-red-500',      text: 'text-red-700' },
  'Extração Dentária':      { bg: 'bg-rose-50',     border: 'border-l-rose-500',     text: 'text-rose-700' },
  'Clareamento Dental':     { bg: 'bg-violet-50',   border: 'border-l-violet-500',   text: 'text-violet-700' },
  'Implante Dentário':      { bg: 'bg-indigo-50',   border: 'border-l-indigo-500',   text: 'text-indigo-700' },
  'Ortodontia':             { bg: 'bg-blue-50',     border: 'border-l-blue-500',     text: 'text-blue-700' },
  'Prótese Dentária':       { bg: 'bg-teal-50',     border: 'border-l-teal-500',     text: 'text-teal-700' },
  'Periodontia':            { bg: 'bg-emerald-50',  border: 'border-l-emerald-500',  text: 'text-emerald-700' },
  'Cirurgia Oral':          { bg: 'bg-orange-50',   border: 'border-l-orange-500',   text: 'text-orange-700' },
  'Consulta Geral':         { bg: 'bg-slate-50',    border: 'border-l-slate-500',    text: 'text-slate-700' },
  'Retorno':                { bg: 'bg-green-50',    border: 'border-l-green-500',    text: 'text-green-700' },
}

// Default color for services not in the map
export const DEFAULT_SERVICE_COLOR = { bg: 'bg-gray-50', border: 'border-l-gray-400', text: 'text-gray-700' }

export function getServiceColor(service: string) {
  return SERVICE_COLORS[service] || DEFAULT_SERVICE_COLOR
}

export const SERVICES_BY_TYPE: Record<string, string[]> = {
  fisioterapia: [
    'Fisioterapia Ortopédica', 'Fisioterapia Neurológica', 'Fisioterapia Traumato-Ortopédica',
    'Reabilitação Esportiva', 'Pilates Terapêutico',
  ],
  odontologia: [
    'Limpeza e Profilaxia', 'Restauração Dentária', 'Tratamento de Canal', 'Extração Dentária',
    'Clareamento Dental', 'Implante Dentário', 'Ortodontia', 'Prótese Dentária', 'Periodontia', 'Cirurgia Oral',
  ],
  psicologia: [
    'Terapia Individual', 'Terapia de Casal', 'Terapia Familiar',
    'Avaliação Psicológica', 'Terapia Cognitivo-Comportamental', 'Psicoterapia Breve',
  ],
  estetica: [
    'Limpeza de Pele', 'Peeling', 'Drenagem Linfática',
    'Massagem Modeladora', 'Radiofrequência', 'Criolipólise', 'Depilação a Laser',
  ],
  nutricao: [
    'Consulta Nutricional', 'Reeducação Alimentar', 'Dieta Terapêutica',
    'Avaliação Corporal', 'Acompanhamento Nutricional',
  ],
  clinica_geral: [
    'Consulta Geral', 'Check-up', 'Exame Clínico', 'Acompanhamento', 'Retorno',
  ],
  pilates: [
    'Pilates Solo', 'Pilates Aparelho', 'Pilates Terapêutico',
    'Pilates para Gestantes', 'Avaliação Postural',
  ],
  fonoaudiologia: [
    'Avaliação Fonoaudiológica', 'Terapia de Fala', 'Terapia de Linguagem',
    'Audiometria', 'Motricidade Orofacial',
  ],
  acupuntura: [
    'Sessão de Acupuntura', 'Auriculoterapia', 'Ventosaterapia',
    'Moxabustão', 'Eletroacupuntura',
  ],
  quiropraxia: [
    'Ajuste Quiroprático', 'Avaliação Postural', 'Terapia Manual',
    'Descompressão Vertebral', 'Mobilização Articular',
  ],
}

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

export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Sem recorrência' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
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
