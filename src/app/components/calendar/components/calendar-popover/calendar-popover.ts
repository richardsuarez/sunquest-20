import { Component, Input, Output, EventEmitter, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BookingService } from '../../../book/service/booking.service';
import { Booking } from '../../../book/model/booking.model';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { currentMonthBookings } from '../../store/calendar.selectors';
import { MatDialog } from '@angular/material/dialog';
import { PopupComponent } from '../../../../shared/popup/popup.component';
import { deleteBookingStart } from '../../store/calendar.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calendar-popover',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './calendar-popover.html',
  styleUrl: './calendar-popover.css'
})
export class CalendarPopoverComponent implements OnInit, AfterViewInit {
  private store = inject(Store);
  private matDialog = inject(MatDialog);
  private router = inject(Router);
  @ViewChild('popoverContainer') popoverContainer: ElementRef | undefined;

  @Input() tripId: string = '';
  @Input() startDate: Date = new Date();
  @Input() endDate: Date = new Date();
  @Input() position: { top: number; left: number } = { top: 0, left: 0 };
  @Output() close = new EventEmitter<void>();

  tripBookings: Booking[] = []
  bookings$!: Observable<Booking[] | null>;
  loading = false;
  error: string | null = null;
  destroy$ = new Subject<void>()
  adjustedPosition: { top: number; left: number } = { top: 0, left: 0 };

  constructor() {
    this.bookings$ = this.store.select(currentMonthBookings)
  }

  ngOnInit() {
    this.bookings$.pipe(takeUntil(this.destroy$)).subscribe(bookings => {
      if (bookings) {
        this.tripBookings = bookings.filter(b => b.tripId === this.tripId);
      }
    })

    this.adjustedPosition = this.position;
  }

  ngAfterViewInit(){
    setTimeout(() => this.adjustPopoverPosition(), 0);
  }

  private adjustPopoverPosition() {
    if (!this.popoverContainer) return;

    const popover = this.popoverContainer.nativeElement as HTMLElement;
    const popoverRect = popover.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const padding = 16; // padding from edges
    const gap = 8; // gap between trigger and popover

    let adjustedTop = this.position.top;
    let adjustedLeft = this.position.left;

    // Get the actual height of the popover from the element
    const popoverHeight = popoverRect.height;
    const popoverWidth = popoverRect.width;

    console.log('Popover Positioning Debug:', {
      triggerPosition: this.position,
      popoverDimensions: { width: popoverWidth, height: popoverHeight },
      viewportDimensions: { width: viewportWidth, height: viewportHeight },
      popoverRect: { top: popoverRect.top, left: popoverRect.left, bottom: popoverRect.bottom, right: popoverRect.right }
    });

    // Calculate positions accounting for the popover's actual dimensions
    const proposedBottom = adjustedTop + popoverHeight + gap;
    const proposedRight = adjustedLeft + popoverWidth + padding;

    // Check if popover goes below viewport
    if (proposedBottom > viewportHeight) {
      // Position above the trigger element instead (popover appears above)
      // Need space for trigger element height (estimate ~40px for event badge)
      adjustedTop = this.position.top - popoverHeight - gap - 40;
      console.log('Adjusted TOP (below viewport detected):', adjustedTop);
    }

    // Check if popover goes beyond right edge
    if (proposedRight > viewportWidth) {
      adjustedLeft = viewportWidth - popoverWidth - padding;
      console.log('Adjusted LEFT (right overflow):', adjustedLeft);
    }

    // Check if popover goes beyond left edge
    if (adjustedLeft < padding) {
      adjustedLeft = padding;
      console.log('Adjusted LEFT (left overflow):', adjustedLeft);
    }

    // Ensure top doesn't go above viewport
    if (adjustedTop < padding) {
      adjustedTop = padding;
    }

    this.adjustedPosition = { top: adjustedTop, left: adjustedLeft };
  }

  deleteBooking(booking: Booking) {
    if (booking && booking.id) {
      const dialogRef = this.matDialog.open(
        PopupComponent,
        {
          data: {
            title: 'Cancel Booking',
            message: `Are you sure you want to cancel booking ${booking.id}?`,
            cancelButton: 'No',
            successButton: 'Yes',
          }
        }
      );
      dialogRef.afterClosed().pipe(
        takeUntil(this.destroy$),
        map(result => {
          if (result) {
            this.store.dispatch(deleteBookingStart({ id: booking.id! }));
          }  // allow navigation if the user click discard button or click outside modal
        })
      ).subscribe();

    }
  }

  getVehicleInfo(booking: Booking): string {
    const vehicles = (booking as any).vehicleIds;
    if (Array.isArray(vehicles)) {
      return vehicles.length > 0 ? `${vehicles.length} vehicle(s)` : 'No vehicles';
    }
    return 'No vehicles';
  }

  getPrimaryCustomer(booking: Booking): string {
    if (!booking.customer || !booking.customer.primaryFirstName || !booking.customer.primaryLastName) {
      return 'Unknown Customer';
    }
    return booking.customer.primaryFirstName + ' ' + booking.customer.primaryMiddleName + ' ' + booking.customer.primaryLastName;
  }

  closePopover() {
    this.close.emit();
  }

  toEditBooking(booking: Booking) {
    this.router.navigate(['main/book/edit', booking.id]);
  }
}
