import { AfterViewInit, Component, Input, ViewChild, ElementRef } from '@angular/core';
import { Booking } from '../../../book/model/booking.model';
import { Trip } from '../../../trip/model/trip.model';
import { Truck } from '../../../truck/model/truck.model';
import { MatTableModule } from '@angular/material/table';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { TableData } from '../container/payment-report';

@Component({
  selector: 'app-print-view-payment-report',
  imports: [
    CommonModule,
    MatTableModule
  ],
  templateUrl: './print-view-payment-report.html',
  styleUrl: './print-view-payment-report.css',
  providers: [provideNativeDateAdapter()],
})
export class PrintViewPaymentReport implements AfterViewInit {
  @Input() truck!: Truck;
  @Input() trip!: Trip;
  @Input() data!: TableData[];

  ngAfterViewInit(){
    window.print();
  }
}
