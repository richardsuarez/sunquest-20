import { Directive, HostListener } from '@angular/core';

@Directive({
	selector: '[appAllowOnlyNumbers]',
})
export class AllowOnlyNumbersDirective {

	@HostListener('input', ['$event'])
	onNativeInput(event: any) {
		const inputValue = event.target.value || '';
		const filteredValue = inputValue.replace(/[^0-9]/g, '')
		if (inputValue !== filteredValue) {
			event.target.value = filteredValue
		}
	}

	@HostListener('paste', ['$event'])
	onPaste(event: ClipboardEvent) {
		const pastedData = event.clipboardData?.getData('text') || '';
		const filtered = pastedData.replace(/[^0-9]/g, '') 
		if(pastedData !== filtered){
			event.preventDefault();
			document.execCommand('insertText', false, filtered)
		}
	}
}