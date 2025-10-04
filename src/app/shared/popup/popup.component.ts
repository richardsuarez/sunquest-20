import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-to-leave',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent {
  constructor(
    public dialogRef: MatDialogRef<PopupComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: {
      title: string,
      message: string,
      cancelButton: string,
      successButton: string,
    }
  ) {}

  cancel(): void {
		this.dialogRef.close('Cancel');
	}

	save(): void {
		this.dialogRef.close('Success');
	}
}
