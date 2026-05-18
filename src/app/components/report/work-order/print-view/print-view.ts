import { AfterViewInit, Component, Input, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BookingGroup, BookReport, TruckReport } from '../../models/report.models';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Booking } from '../../../book/model/booking.model';
import { Address } from '../../../customer/model/customer.model';

@Component({
  selector: 'app-print-view-work-order',
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './print-view.html',
  styleUrl: './print-view.css',
  providers: [provideNativeDateAdapter()],
})
export class PrintViewWorkOrder implements AfterViewInit {

  @Input() bookReport: BookReport | null = null;
  @Input() truckTrips: TruckReport | null = null;
  @Input() bookingGroup: BookingGroup | null = null;
  @Output() closed = new EventEmitter<void>();

  ngAfterViewInit(): void {
    setTimeout(() => {
      window.print();
    }, 100);
  }

  onPrintClose(): void {
    this.closed.emit();
  }

  formatAddress(address: Address | null): string {
    if (!address) return 'Not provided';
    const { address1, address2, bldg, apt, city, state, zipCode } = address;
    return `${address1}${address2 ? `, ${address2}` : ''}${bldg ? `, Bldg. ${bldg}` : ''}${apt ? `, Apt. ${apt}` : ''}, ${city}, ${state} ${zipCode}`;
  }

  getRecNo(booking: Booking): string {
    if (!booking.customer) return 'N/A';
    if (!booking.customer.vehicles || booking.customer.vehicles.length === 0) return 'N/A';
    if (!booking.customer.vehicles[0].recNo) return 'N/A';
    return `Rec No: ${booking.customer.vehicles[0].recNo}`;
  }

  getTripTotals(bookings: Booking[]): { weight: number; volume: number } {
    return bookings.reduce(
      (acc, booking) => ({
        weight: acc.weight + (booking.paycheck?.amount || 0),
        volume: acc.volume + 1
      }),
      { weight: 0, volume: 0 }
    );
  }

  vehicleInfo(booking: Booking) {
    if(booking.customer && booking.customer.vehicles && booking.customer.vehicles[0]) {
      const vehicle = booking.customer.vehicles[0];
      return `${vehicle?.color || ''} ${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''} (${vehicle?.plate || ''})`.trim();
    }
    return 'No provided'
  }
}
