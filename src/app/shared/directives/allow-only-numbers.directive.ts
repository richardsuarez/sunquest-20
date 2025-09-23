import { Directive, HostListener } from '@angular/core';

@Directive({
	selector: '[appAllowOnlyNumbers]',
})
export class AllowOnlyNumbersDirective {
	@HostListener('keypress', ['$event'])
	onKeyPress(event: KeyboardEvent) {
		if (
			event.key &&
			!Number.isInteger(Number.parseInt(event.key, 10)) &&
			event.key !== 'Backspace' &&
			event.key !== 'Delete'
		) {
			event.preventDefault();
		}
	}

	@HostListener('paste', ['$event'])
	onPaste(event: any) {
		const data = event.clipboardData.getData('text');
		for (const character of data) {
			if (!Number.isInteger(Number.parseInt(character, 10))) {
				event.preventDefault();
				break;
			}
		}
	}
}