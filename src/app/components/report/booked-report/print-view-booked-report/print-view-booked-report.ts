import { AfterViewInit, Component, Input } from '@angular/core';
import { Truck } from '../../../truck/model/truck.model';
import { Trip } from '../../../trip/model/trip.model';
import { TableData } from '../../payment-report/container/payment-report';
import { MatTableModule } from '@angular/material/table';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { Booking } from '../../../book/model/booking.model';
import { Customer } from '../../../customer/model/customer.model';

@Component({
  selector: 'app-print-view-booked-report',
  imports: [
    CommonModule,
    MatTableModule
  ],
  templateUrl: './print-view-booked-report.html',
  styleUrl: './print-view-booked-report.css',
  providers: [provideNativeDateAdapter()],
})
export class PrintViewBookedReport implements AfterViewInit {
  @Input() bookings!: Booking[];
  @Input() startDate!: Date;
  @Input() endDate!: Date;

  ngAfterViewInit() {
    window.print();
  }

  searchRecNo(booking: Booking): string {
    if (booking.customer && booking.customer.vehicles && booking.customer.vehicles.length > 0) {
      return booking.customer.vehicles[0].recNo || '';
    }
    return 'No provided';
  }

  vehicleMake(customer: Customer): string {
    if (customer.vehicles) {
      return customer.vehicles[0].make || 'No provided';
    }
    return 'No provided';
  }

  vehicleModel(customer: Customer): string {
    if (customer.vehicles) {
      return customer.vehicles[0].model || 'No provided';
    }
    return 'No provided';
  }

  weekNumber(date: Date | null): number {
    if (!date) {
      return 0;
    }
    const yearStart = new Date(date.getFullYear(), 0, 1); // Jan 1st, of the year given
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 604800000));
  }
}
