import api from './client';
import type { ActivityLog, Room, RoomPayload, RoomStatus } from '../types';

export interface RoomFilters {
  search?: string;
  status?: RoomStatus | 'all';
  floor?: number;
}

export async function fetchRooms(filters: RoomFilters = {}): Promise<Room[]> {
  const params: Record<string, string> = {};

  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.status && filters.status !== 'all') {
    params.status = filters.status;
  }
  if (filters.floor) {
    params.floor = String(filters.floor);
  }

  const { data } = await api.get<{ data: Room[] }>('/rooms', { params });
  return data.data;
}

export async function fetchRoom(id: number): Promise<Room> {
  const { data } = await api.get<{ data: Room }>(`/rooms/${id}`);
  return data.data;
}

export async function createRoom(payload: RoomPayload): Promise<Room> {
  const { data } = await api.post<{ data: Room }>('/rooms', payload);
  return data.data;
}

export async function updateRoom(id: number, payload: RoomPayload): Promise<Room> {
  const { data } = await api.put<{ data: Room }>(`/rooms/${id}`, payload);
  return data.data;
}

export async function deleteRoom(id: number): Promise<void> {
  await api.delete(`/rooms/${id}`);
}

export async function fetchRoomLogs(id: number): Promise<ActivityLog[]> {
  const { data } = await api.get<{ data: ActivityLog[] }>(`/rooms/${id}/logs`);
  return data.data;
}
