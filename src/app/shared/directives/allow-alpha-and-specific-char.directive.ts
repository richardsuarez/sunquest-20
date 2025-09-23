import { Directive, HostListener } from '@angular/core';

@Directive({
	selector: '[appAllowAlphaAndSpecificChar]',
})
export class AllowAlphaAndSpecificCharDirective {
	// This directive only allow the key dscribes in the list and characters: [A-Za-z]

	@HostListener('keypress', ['$event'])
	onKeyPress(event: KeyboardEvent) {
		const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', '.', '-', "'", " "];
		const isAlpha = /^[a-zA-Z]$/;
		if (!allowedKeys.includes(event.key) && !event.key.match(isAlpha)) {
			event.preventDefault();
		}
	}
}