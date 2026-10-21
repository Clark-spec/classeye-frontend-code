import type { Schedule, ScheduleDay, SchedulePayload } from '../types';

export const DAY_LABELS: Record<ScheduleDay, string> = {
  M: 'Mon',
  T: 'Tue',
  W: 'Wed',
  TH: 'Thu',
  F: 'Fri',
  SAT: 'Sat',
};

export const DAY_FULL_LABELS: Record<ScheduleDay, string> = {
  M: 'Monday',
  T: 'Tuesday',
  W: 'Wednesday',
  TH: 'Thursday',
  F: 'Friday',
  SAT: 'Saturday',
};

export function formatTime(value: string): string {
  const [hourPart, minutePart] = value.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return value;
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

export function formatDayList(days: ScheduleDay[]): string {
  return days.map((day) => DAY_FULL_LABELS[day]).join(', ');
}

export function formatUnits(units: number): string {
  return `${units} ${units === 1 ? 'unit' : 'units'}`;
}

export function toSchedulePayload(schedule: Schedule): SchedulePayload {
  return {
    instructor_id: schedule.instructor.id,
    room_id: schedule.room.id,
    subject_code: schedule.subject_code,
    descriptive_title: schedule.descriptive_title,
    days: schedule.days,
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    units: schedule.units,
  };
}

export function sortSchedules(schedules: Schedule[]): Schedule[] {
  return [...schedules].sort((left, right) => {
    const timeCompare = left.start_time.localeCompare(right.start_time);
    if (timeCompare !== 0) {
      return timeCompare;
    }
    return left.subject_code.localeCompare(right.subject_code);
  });
}
