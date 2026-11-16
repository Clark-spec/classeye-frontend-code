export type UserRole = 'admin' | 'teacher';

export interface User {
  id: number;
  name: string;
  staff_id: string;
  role: UserRole;
}

export type RoomStatus = 'occupied' | 'empty' | 'maintenance';

export interface Room {
  id: number;
  name: string;
  floor: number;
  building: string;
  capacity: number;
  people_count: number;
  is_maintenance: boolean;
  status: RoomStatus;
  is_over_capacity: boolean;
  updated_at: string;
  logs?: ActivityLog[];
}

export interface RoomPayload {
  name: string;
  floor: number;
  building: string;
  capacity: number;
  people_count: number;
  is_maintenance: boolean;
}

export interface ActivityLog {
  id: number;
  message: string;
  user: string | null;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  occupied: number;
  empty: number;
  maintenance: number;
  alerts: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_rooms: Room[];
}

export interface Alert {
  id: number;
  name: string;
  floor: number;
  building: string;
  capacity: number;
  people_count: number;
  message: string;
  updated_at: string;
}

export type InsightRisk = 'critical' | 'high' | 'medium' | 'low';
export type InsightConfidence = 'low' | 'medium' | 'high';

export interface RoomInsight {
  room_id: number;
  name: string;
  floor: number;
  building: string;
  status: RoomStatus;
  capacity: number;
  people_count: number;
  forecast_people_count: number;
  forecast_minutes: number;
  growth_per_hour: number;
  utilization: number;
  risk_level: InsightRisk;
  minutes_to_capacity: number | null;
  anomaly: {
    detected: boolean;
    direction: 'increase' | 'decrease' | null;
    change: number;
    z_score: number | null;
  };
  confidence: InsightConfidence;
  reason: string;
  samples: number;
}

export interface InsightsSummary {
  generated_at: string;
  window_hours: number;
  forecast_minutes: number;
  rooms_analysed: number;
  at_risk: number;
  anomalies: number;
  average_utilization: number;
  headline: string;
  rooms: RoomInsight[];
}

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantAnswer {
  answer: string;
  provider: string;
  model: string | null;
  degraded: boolean;
  forecast_minutes: number;
  generated_at: string;
}

export interface ApiValidationError {
  message: string;
  errors?: Record<string, string[]>;
}

export const SCHEDULE_DAYS = ['M', 'T', 'W', 'TH', 'F', 'SAT'] as const;

export type ScheduleDay = (typeof SCHEDULE_DAYS)[number];

export interface ScheduleRoom {
  id: number;
  name: string;
  floor: number;
  building: string;
}

export interface Schedule {
  id: number;
  instructor: User;
  room: ScheduleRoom;
  subject_code: string;
  descriptive_title: string;
  days: ScheduleDay[];
  start_time: string;
  end_time: string;
  units: number;
  updated_at: string | null;
}

export interface SchedulePayload {
  instructor_id: number;
  room_id: number;
  subject_code: string;
  descriptive_title: string;
  days: ScheduleDay[];
  start_time: string;
  end_time: string;
  units: number;
}
