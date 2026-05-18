import { Component, Input } from '@angular/core';
import { Customer, Vehicle } from '../../customer/model/customer.model';
import { Booking } from '../../book/model/booking.model';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DatePipe } from '@angular/common';
import { Truck } from '../../truck/model/truck.model';

@Component({
  selector: 'app-customer-report-template',
  imports: [DatePipe],
  templateUrl: './customer-report-template.html',
  styleUrl: './customer-report-template.css',
  providers: [provideNativeDateAdapter()],
})
export class CustomerReportTemplate{
  @Input() customer!: Customer;
  @Input() vehicle: Vehicle | null = null;
  @Input() isPrinting: boolean = false;
  @Input() printFilter: string = '';
  @Input() booking: Booking | null = null;
  @Input() truck: Truck | null = null;


  floridaNotes(): string {
    if(this.booking) {
      if(this.booking.from === 'Florida') {
        return this.booking.pickupNotes || 'No notes';
      } else {
        if(this.booking.from === 'New York') {
          return this.booking.deliveryNotes || 'No notes';
        }
      }
    }
    return '';
  }

  newYorkNotes(): string {
    if(this.booking) {
      if(this.booking.from === 'New York') {
        return this.booking.pickupNotes || 'No notes';
      } else {
        if(this.booking.from === 'Florida') {
          return this.booking.deliveryNotes || 'No notes';
        }
      }
    }
    return '';
  }
}
