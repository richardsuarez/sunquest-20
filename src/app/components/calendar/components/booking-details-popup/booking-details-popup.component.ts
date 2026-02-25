import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Booking } from '../../../book/model/booking.model';
import { Address, Vehicle } from '../../../customer/model/customer.model';

@Component({
  selector: 'app-booking-details-popup',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './booking-details-popup.component.html',
  styleUrls: ['./booking-details-popup.component.scss']
})
export class BookingDetailsPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<BookingDetailsPopupComponent>,
    @Inject(MAT_DIALOG_DATA) readonly booking: Booking
  ) {}

  getPrimaryCustomer(): string {
    if (!this.booking.customer) return 'Unknown Customer';
    const { primaryFirstName, primaryMiddleName, primaryLastName } = this.booking.customer;
    return [primaryFirstName, primaryMiddleName, primaryLastName]
      .filter(n => n)
      .join(' ');
  }

  getCustomerContact(){
    return {
      email: this.booking.customer?.email || null,
      primaryPhone: this.booking.customer?.primaryPhone || null,
      secondaryPhone: this.booking.customer?.secondaryPhone || null
    };
  }

  getVehicle(): Vehicle | undefined {
    if(this.booking?.customer?.vehicles){
      return this.booking?.customer?.vehicles[0];
    }
    return undefined;
  }

  formatAddress(address: Address | null): string {
    if (!address) return 'Not provided';
    const { address1, address2, bldg, apt, city, state, zipCode } = address;
    return `${address1}${address2 ? `, ${address2}` : ''}${bldg ? `, Bldg. ${bldg}` : ''}${apt ? `, Apt. ${apt}` : ''}, ${city}, ${state} ${zipCode}`;
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onEdit(): void {
    this.dialogRef.close('edit');
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
