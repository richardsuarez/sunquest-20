import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Booking } from '../../../book/model/booking.model';

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

  getCustomerContact(): { email: string | null; phone: string | null; telephone: string | null } {
    return {
      email: this.booking.customer?.email || null,
      phone: this.booking.customer?.phone || null,
      telephone: this.booking.customer?.telephone || null
    };
  }

  getVehicles(): any[] {
    const vehicleIds = this.booking.vehicleIds || [];
    const vehicles = this.booking.customer?.vehicles || [];
    return vehicles.filter(v => v.id && vehicleIds.includes(v.id));
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
