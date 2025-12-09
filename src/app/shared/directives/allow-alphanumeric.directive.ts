import { Directive, HostListener } from '@angular/core';

@Directive({
	selector: '[appAllowAlphanumeric]',
})
export class AllowAlphanumericDirective {
	// This directive only allow character inside this regular expression [A-Za-z0-9_]

	@HostListener('input', ['$event'])
	onInput(event: any) {
		// Get the value safely (works for both event types)
		const inputValue = event.detail?.value ?? event.target.value ?? '';
		// Filter out any character that's not a letter or number
		const filtered = inputValue.replace(/[^a-zA-Z0-9]/g, '');
		// If something was removed, update the displayed value
		if (inputValue !== filtered) {
			const target = event.target as HTMLInputElement;
			target.value = filtered;
		}
	}
	@HostListener('paste', ['$event'])
	onPaste(event: ClipboardEvent) {
		const pastedData = event.clipboardData?.getData('text') || '';
		const filtered = pastedData.replace(/[^a-zA-Z0-9]/g, '');
		if (pastedData !== filtered) {
			event.preventDefault();
			document.execCommand('insertText', false, filtered);
		}
	}
}