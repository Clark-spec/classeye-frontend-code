import api from './client';
import type { Schedule, ScheduleDay, SchedulePayload, User } from '../types';

export interface ScheduleFilters {
  search?: string;
  day?: ScheduleDay;
  instructorId?: number;
}

export async function fetchSchedules(filters: ScheduleFilters = {}): Promise<Schedule[]> {
  const params: Record<string, string> = {};

  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.day) {
    params.day = filters.day;
  }
  if (filters.instructorId) {
    params.instructor_id = String(filters.instructorId);
  }

  const { data } = await api.get<{ data: Schedule[] }>('/schedules', { params });
  return data.data;
}

export async function fetchInstructors(): Promise<User[]> {
  const { data } = await api.get<{ data: User[] }>('/instructors');
  return data.data;
}

export async function createSchedule(payload: SchedulePayload): Promise<Schedule> {
  const { data } = await api.post<{ data: Schedule }>('/schedules', payload);
  return data.data;
}

export async function updateSchedule(id: number, payload: SchedulePayload): Promise<Schedule> {
  const { data } = await api.put<{ data: Schedule }>(`/schedules/${id}`, payload);
  return data.data;
}

export async function deleteSchedule(id: number): Promise<void> {
  await api.delete(`/schedules/${id}`);
}
