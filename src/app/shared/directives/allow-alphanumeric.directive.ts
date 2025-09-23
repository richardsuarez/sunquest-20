import { Directive, HostListener } from '@angular/core';

@Directive({
	selector: '[appAllowAlphanumeric]',
})
export class AllowAlphanumericDirective {
	// This directive only allow character inside this regular expression [A-Za-z0-9_]

	@HostListener('keypress', ['$event'])
	onKeyPress(event: KeyboardEvent) {
		const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' '];
		if (!allowedKeys.includes(event.key) && !event.key.match(/\w/)) {
			event.preventDefault();
		}
	}

	@HostListener('paste', ['$event'])
	onPaste(event: any) {
		const data = event.clipboardData.getData('text');
		for (const character of data) {
			if (!character.match(/\w/) && !character.match(' ')) {
				event.preventDefault();
				break;
			}
		}
	}
}