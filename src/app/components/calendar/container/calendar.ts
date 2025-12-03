import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { CalendarViewComponent, MonthChange, EventClickData } from '../components/calendar-view/calendar-view';
import { CalendarPopoverComponent } from '../components/calendar-popover/calendar-popover';
import { CalendarEvent } from '../model/calendar-event.model';
import * as CalendarActions from '../store/calendar.actions';
import * as CalendarSelectors from '../store/calendar.selectors';

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    CalendarViewComponent,
    CalendarPopoverComponent
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar implements OnInit {
  private store = inject(Store);
  private readonly route = inject(Router);

  selectedDate: Date = new Date();
  calendarEvents$: Observable<{ [dateKey: string]: CalendarEvent[] }>;
  calendarEvents: { [dateKey: string]: CalendarEvent[] } = {};

  selectedTrip: CalendarEvent | null = null;
  popoverPosition: { top: number; left: number } = { top: 0, left: 0 };
  showPopover = false;
  currentMonthStart: Date = new Date();
  currentMonthEnd: Date = new Date();

  constructor() {
    this.calendarEvents$ = this.store.select(CalendarSelectors.selectCalendarEvents);
  }

  ngOnInit() {
    // Load current month's bookings and trips
    const now = new Date();
    this.currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    this.store.dispatch(CalendarActions.loadBookingsForMonth({ startDate: this.currentMonthStart, endDate: this.currentMonthEnd }));
    this.store.dispatch(CalendarActions.loadTrucksAndTrips({ monthStart: this.currentMonthStart, monthEnd: this.currentMonthEnd }));

    this.calendarEvents$.subscribe(events => {
      this.calendarEvents = events;
    });
  }

  onMonthChanged(monthChange: MonthChange) {
    // Update current month for popover data fetching
    this.currentMonthStart = monthChange.startDate;
    this.currentMonthEnd = monthChange.endDate;

    // Close any open popover
    this.showPopover = false;

    // Dispatch actions to load bookings and trips for the new month
    this.store.dispatch(CalendarActions.loadBookingsForMonth({
      startDate: monthChange.startDate,
      endDate: monthChange.endDate,
    }));
    this.store.dispatch(CalendarActions.loadTrucksAndTrips({
      monthStart: monthChange.startDate,
      monthEnd: monthChange.endDate
    }));
  }

  newBooking() {
    this.route.navigate(['main/book/new']);
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
  }

  onEventClick(clickData: EventClickData) {
    const event = clickData.event;
    this.selectedTrip = event;
    this.popoverPosition = clickData.position;
    this.showPopover = true;
  }

  onDayClick(date: Date) {
    // Handle day click
    console.log('Day clicked:', date);
    this.selectedDate = date;
  }

  closePopover() {
    this.showPopover = false;
    this.selectedTrip = null;
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
}
