import { Schedule } from '../model/schedule.model';

export interface ScheduleState {
  schedules: Schedule[];
  loading: boolean;
  saving: boolean;
  error: Error | null;
}

export const initialScheduleState: ScheduleState = {
  schedules: [],
  loading: false,
  saving: false,
  error: null
};