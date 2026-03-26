export interface Patient {
  id: string
  name: string
  initials: string
  phone: string
  service: string
  status: 'Ativo' | 'Pendente' | 'Inativo'
  avatarColor: string
}

export interface Appointment {
  id: string
  time: string
  patientId: string
  patientName: string
  patientInitials: string
  avatarColor: string
  service: string
  status: 'CONCLUÍDO' | 'PENDENTE' | 'CONFIRMADO'
  sessions?: string
}

export interface Payment {
  id: string
  patientId: string
  patientName: string
  patientInitials: string
  avatarColor: string
  description: string
  value: number
  dueDate: string
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO'
}

export interface Service {
  name: string
  percentage: number
  color: string
}

export const patients: Patient[] = [
  { id: '1', name: 'Maria Oliveira', initials: 'MO', phone: '(11) 99234-5678', service: 'Fisioterapia Traumato-Ortopédica', status: 'Ativo', avatarColor: 'bg-teal-500' },
  { id: '2', name: 'João Silva', initials: 'JS', phone: '(11) 98765-4321', service: 'Reabilitação Esportiva', status: 'Ativo', avatarColor: 'bg-emerald-500' },
  { id: '3', name: 'Ana Ferreira', initials: 'AF', phone: '(11) 91234-5678', service: 'Pilates Terapêutico', status: 'Ativo', avatarColor: 'bg-purple-500' },
  { id: '4', name: 'Roberto Costa', initials: 'RC', phone: '(11) 97654-3210', service: 'Fisioterapia Neurológica', status: 'Ativo', avatarColor: 'bg-cyan-500' },
  { id: '5', name: 'Pedro Mendes', initials: 'PM', phone: '(11) 95555-1234', service: 'Fisioterapia Ortopédica', status: 'Pendente', avatarColor: 'bg-orange-500' },
  { id: '6', name: 'Carla Lima', initials: 'CL', phone: '(11) 93333-9876', service: 'Reabilitação Esportiva', status: 'Ativo', avatarColor: 'bg-pink-500' },
]

export const appointments: Appointment[] = [
  { id: '1', time: '09:00', patientId: '1', patientName: 'Maria Oliveira', patientInitials: 'MO', avatarColor: 'bg-teal-500', service: 'Fisioterapia Traumato-Ortopédica', status: 'CONCLUÍDO' },
  { id: '2', time: '10:30', patientId: '2', patientName: 'João Silva', patientInitials: 'JS', avatarColor: 'bg-emerald-500', service: 'Reabilitação Esportiva', status: 'PENDENTE', sessions: '4/10 sessões' },
  { id: '3', time: '14:00', patientId: '3', patientName: 'Ana Ferreira', patientInitials: 'AF', avatarColor: 'bg-purple-500', service: 'Pilates Terapêutico', status: 'CONFIRMADO' },
  { id: '4', time: '15:30', patientId: '4', patientName: 'Roberto Costa', patientInitials: 'RC', avatarColor: 'bg-cyan-500', service: 'Fisioterapia Neurológica', status: 'CONFIRMADO' },
]

export const payments: Payment[] = [
  { id: '1', patientId: '5', patientName: 'Pedro Mendes', patientInitials: 'PM', avatarColor: 'bg-orange-500', description: 'Sessão de fisioterapia', value: 150, dueDate: '22/10/2023', status: 'PAGO' },
  { id: '2', patientId: '6', patientName: 'Carla Lima', patientInitials: 'CL', avatarColor: 'bg-pink-500', description: 'Reabilitação esportiva', value: 280, dueDate: '28/10/2023', status: 'PENDENTE' },
  { id: '3', patientId: '1', patientName: 'Maria Oliveira', patientInitials: 'MO', avatarColor: 'bg-teal-500', description: 'Fisioterapia ortopédica', value: 200, dueDate: '15/10/2023', status: 'PAGO' },
  { id: '4', patientId: '2', patientName: 'João Silva', patientInitials: 'JS', avatarColor: 'bg-emerald-500', description: 'Plano mensal — 10 sessões', value: 750, dueDate: '01/10/2023', status: 'PAGO' },
]

export const pendingPayments: Payment[] = [
  { id: '1', patientId: '5', patientName: 'Pedro Mendes', patientInitials: 'PM', avatarColor: 'bg-orange-500', description: 'Sessão de fisioterapia', value: 150, dueDate: '22/10/2023', status: 'ATRASADO' },
  { id: '2', patientId: '6', patientName: 'Carla Lima', patientInitials: 'CL', avatarColor: 'bg-pink-500', description: 'Reabilitação esportiva', value: 280, dueDate: '28/10/2023', status: 'PENDENTE' },
]

export const services: Service[] = [
  { name: 'Fisioterapia Ortopédica', percentage: 38, color: 'bg-emerald-500' },
  { name: 'Reabilitação Esportiva', percentage: 26, color: 'bg-blue-500' },
  { name: 'Pilates Terapêutico', percentage: 20, color: 'bg-purple-500' },
  { name: 'Fisioterapia Neurológica', percentage: 16, color: 'bg-red-500' },
]

export const monthlyRevenue = [
  { month: 'Jan', value: 5200 },
  { month: 'Fev', value: 5800 },
  { month: 'Mar', value: 5500 },
  { month: 'Abr', value: 6200 },
  { month: 'Mai', value: 7500 },
  { month: 'Jun', value: 7200 },
  { month: 'Jul', value: 7000 },
  { month: 'Ago', value: 7800 },
  { month: 'Set', value: 8450 },
]

export const weeklyConsultations = [
  { week: 'S1', value: 18 },
  { week: 'S2', value: 22 },
  { week: 'S3', value: 28 },
  { week: 'S4', value: 32 },
  { week: 'S5', value: 35 },
  { week: 'S6', value: 38 },
  { week: 'S7', value: 33 },
  { week: 'S8', value: 40 },
  { week: 'S9', value: 42 },
]

export const servicesList = [
  'Fisioterapia Ortopédica',
  'Fisioterapia Neurológica',
  'Fisioterapia Traumato-Ortopédica',
  'Reabilitação Esportiva',
  'Pilates Terapêutico',
]

export const durations = ['30 min', '45 min', '60 min', '90 min']
