import { createAction, props } from '@ngrx/store';
import { Season } from '../../season/models/season.model';
import { Customer } from '../../customer/model/customer.model';
import { Booking } from '../../book/model/booking.model';

export const loadCustomers = createAction(
  '[Main] Load Customer'
);

export const loadCustomersSuccess = createAction('[Main] Load Customers Success', props<{ customers: Customer[] }>());
export const loadCustomersFail = createAction('[Main] Load Customer Fail', props<{ error: string }>());
export const loadSeasons = createAction('[Main] Load Seasons');
export const loadSeasonsSuccess = createAction('[Main] Load Seasons Success', props<{ seasons: Season[] }>());
export const loadSeasonsFail = createAction('[Main] Load Seasons Fail', props<{ error: string }>());
export const activateSeason = createAction('[Main] Activate Season', props<{ season: Season }>());
export const activateSeasonSuccess = createAction('[Main] Activate Season Success', props<{ season: Season }>());
export const activateSeasonFail = createAction('[Main] Activate Season Fail', props<{ error: string }>());
export const deactivateSeason = createAction('[Main] Deactivate Season', props<{ seasonId: string }>());
export const deactivateSeasonSuccess = createAction('[Main] Deactivate Season Success', props<{ seasonId: string }>());
export const deactivateSeasonFail = createAction('[Main] Deactivate Season Fail', props<{ error: string }>());

export const setBreakpoint = createAction('[Main] Set Breakpoint', props<{ isMobile: boolean }>());
export const loadBooking = createAction('[Main] Load booking', props<{ booking: Booking }>());
export const loadCustomer = createAction('[Main] Load a customer in state', props<{customer: Customer}>());

export const createEmptyBooking = createAction('[Book] Create empty booking');