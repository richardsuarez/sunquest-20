import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { CalendarViewComponent } from '../components/calendar-view/calendar-view';
import { CalendarPopoverComponent } from '../components/calendar-popover/calendar-popover';
import { TripPopoverComponent } from '../components/trip-popover/trip-popover.component';
import { CalendarEvent, MonthChange, EventClickData, Day } from '../model/calendar-event.model';
import * as CalendarActions from '../store/calendar.actions';
import * as CalendarSelectors from '../store/calendar.selectors';
import * as MainSelectors from '../../main/store/main.selectors';
import { Season } from '../../season/models/season.model';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    CalendarViewComponent
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar implements OnInit, OnDestroy {
  private store = inject(Store);
  private matDialog = inject(MatDialog);
  private destroy$ = new Subject<void>();
  isMobile!: boolean;

  selectedDay!: Day;
  calendarEvents$: Observable<{ [dateKey: string]: CalendarEvent[] }>;
  calendarEvents: { [dateKey: string]: CalendarEvent[] } = {};
  truckList$: Observable<any[]>;
  truckList: any[] = [];
  seasons$!: Observable<Season[]>;

  popoverPosition: { top: number; left: number } = { top: 0, left: 0 };
  showPopover = false;
  currentMonthStart: Date = new Date();
  currentMonthEnd: Date = new Date();
  selectedTruck: string | null = null;
  activeSeason: Season | null = null;

  constructor(
    private readonly breakpoints: BreakpointObserver,
  ) {
    this.calendarEvents$ = this.store.select(CalendarSelectors.selectCalendarEvents);
    this.truckList$ = this.store.select(CalendarSelectors.selectTrucks);
    this.seasons$ = this.store.select(MainSelectors.selectSeasons);
  }

  async ngOnInit() {
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
    ]).subscribe(res => {
      this.isMobile = res.matches;
    });
    // Load current month's bookings and trips
    const now = new Date();
    this.currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Load trucks for the add trip form
    this.truckList$.pipe(takeUntil(this.destroy$)).subscribe(trucks => {
      this.truckList = trucks || [];
    });

    this.calendarEvents$.pipe(takeUntil(this.destroy$)).subscribe(events => {
      this.calendarEvents = events;
    });

    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      this.activeSeason = seasons.find(s => s.isActive) || null;
      if (this.activeSeason) {
        this.store.dispatch(CalendarActions.loadBookingsForMonth({
          startDate: this.currentMonthStart,
          endDate: this.currentMonthEnd,
          season: this.activeSeason,
        }));
        this.store.dispatch(CalendarActions.loadTrucksAndTrips({
          monthStart: this.currentMonthStart,
          monthEnd: this.currentMonthEnd,
          season: this.activeSeason,
        }));
      } else {
        this.store.dispatch(CalendarActions.clearCalendarEvents());
      }
    });
  }

  onMonthChanged(monthChange: MonthChange) {
    // Update current month for popover data fetching
    this.currentMonthStart = monthChange.startDate;
    this.currentMonthEnd = monthChange.endDate;

    // Close any open popover
    this.showPopover = false;

    // Dispatch actions to load bookings and trips for the new month
    if (this.activeSeason) {
      this.store.dispatch(CalendarActions.loadBookingsForMonth({
        startDate: monthChange.startDate,
        endDate: monthChange.endDate,
        season: this.activeSeason,
      }));
      this.store.dispatch(CalendarActions.loadTrucksAndTrips({
        monthStart: monthChange.startDate,
        monthEnd: monthChange.endDate,
        season: this.activeSeason
      }));
    }
  }

  newTrip() {
    this.matDialog.open(TripPopoverComponent, {
      data: {
        trucks: this.truckList,
        trip: {
          loadNumber: '',
          departureDate: new Date(),
          arrivalDate: new Date(),
          origin: '',
          destination: '',
          remLoadCap: 0,
          remCarCap: 0,
          delayDate: null,
          season: this.activeSeason ? `${this.activeSeason.seasonName}-${this.activeSeason.year}` : null,
        },
        truckTrip: null,
      },
      maxWidth: '500px',
      width: '90vw',
    });
  }

  onDateSelected(day: Day) {
    this.selectedDay = day;
  }

  onEventClick(clickData: EventClickData) {
    const event = clickData.event;
    this.store.dispatch(CalendarActions.loadSelectedTrip({ trip: event.trip! }));
    
    this.matDialog.open(CalendarPopoverComponent, {
      data:{
        isMobile: this.isMobile,
        truckId: event.truckId || null,
        startDate: this.currentMonthStart,
        endDate: this.currentMonthEnd,
      },
      maxWidth: '90vw',
    })
  }

  onDayClick(day: Day) {
    this.selectedDay = day;
  }

  closePopover() {
    this.showPopover = false;
    this.store.dispatch(CalendarActions.loadSelectedTrip({ trip: null }));
  }

  // Method to add a custom event to a specific date
  addEventToDate(event: CalendarEvent) {
    this.store.dispatch(CalendarActions.addCalendarEvent({ event }));
  }

  // Method to remove an event
  removeEvent(eventId: string, dateKey: string) {
    this.store.dispatch(CalendarActions.removeCalendarEvent({ eventId, dateKey }));
  }

  // Method to update an event
  updateEvent(event: CalendarEvent, oldDateKey: string) {
    this.store.dispatch(CalendarActions.updateCalendarEvent({ event, oldDateKey }));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
