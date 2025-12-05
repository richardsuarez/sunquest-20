import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CalendarEvent } from '../../model/calendar-event.model';

interface Day {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface MonthChange {
  startDate: Date;
  endDate: Date;
}

export interface EventClickData {
  event: CalendarEvent;
  position: { top: number; left: number };
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './calendar-view.html',
  styleUrl: './calendar-view.css'
})
export class CalendarViewComponent implements OnInit, OnChanges {
  @Input() selectedDate: Date = new Date();
  @Input() calendarEvents: { [dateKey: string]: CalendarEvent[] } = {};
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() eventClick = new EventEmitter<EventClickData>();
  @Output() dayClick = new EventEmitter<Date>();
  @Output() monthChanged = new EventEmitter<MonthChange>();

  currentMonth: Date = new Date();
  days: Day[] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  ngOnInit() {
    this.generateCalendarDays();
    this.emitMonthChange();
  }

  ngOnChanges() {
    this.generateCalendarDays();
  }

  generateCalendarDays() {
    this.days = [];
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayOfWeek = firstDay.getDay();
    const lastDayDate = lastDay.getDate();
    const prevLastDayDate = prevLastDay.getDate();
    
    let dateCounter = 0;

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevLastDayDate - i);
      const dateKey = this.formatDateKey(date);
      this.days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        events: this.calendarEvents[dateKey] || []
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayDate; i++) {
      const date = new Date(year, month, i);
      const dateKey = this.formatDateKey(date);
      this.days.push({
        date,
        dateKey,
        isCurrentMonth: true,
        isToday: this.isToday(date),
        events: this.calendarEvents[dateKey] || []
      });
    }

    // Next month days
    const remainingDays = 42 - this.days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const dateKey = this.formatDateKey(date);
      this.days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        events: this.calendarEvents[dateKey] || []
      });
    }
  }

  formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendarDays();
    this.emitMonthChange();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendarDays();
    this.emitMonthChange();
  }

  private emitMonthChange() {
    const startDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const endDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    this.monthChanged.emit({ startDate, endDate });
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    this.dateSelected.emit(date);
    this.dayClick.emit(date);
  }

  onEventClick(event: CalendarEvent, mouseEvent: MouseEvent) {
    const rect = (mouseEvent.target as HTMLElement).getBoundingClientRect();
    const position = {
      top: rect.bottom + 8,
      left: rect.left
    };
    this.eventClick.emit({ event, position });
  }

  getDayEvents(day: Day): CalendarEvent[] {
    return day.events;
  }

  getMonthYearDisplay(): string {
    return `${this.monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
  }
}
