import api from './client';
import type { InsightsSummary, RoomInsight } from '../types';

/**
 * Advisory occupancy intelligence. These endpoints are read-only; the UI must
 * never treat a forecast as an instruction to change a room.
 */
export async function fetchInsights(): Promise<InsightsSummary> {
  const { data } = await api.get<InsightsSummary>('/insights');
  return data;
}

export async function fetchRoomInsight(roomId: number): Promise<RoomInsight> {
  const { data } = await api.get<RoomInsight>(`/insights/rooms/${roomId}`);
  return data;
}
