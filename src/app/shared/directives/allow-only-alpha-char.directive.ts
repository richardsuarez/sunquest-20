import { Directive, HostListener } from '@angular/core';

@Directive({
	selector: '[appAllowOnlyAlphaChar]',
})
export class AllowOnlyAlphaCharDirective {
	// This directive only allow the key dscribes in the list and characters: [A-Za-z]

	@HostListener('input', ['$event'])
	onInput(event: any) {
		// Get the value safely (works for both event types)
		const inputValue = event.detail?.value ?? event.target.value ?? '';
		// Filter out any character that's not a letter or number
		const filtered = inputValue.replace(/[^a-zA-Z ]/g, '');
		// If something was removed, update the displayed value
		if (inputValue !== filtered) {
			const target = event.target as HTMLInputElement;
			target.value = filtered;
		}
	}
}