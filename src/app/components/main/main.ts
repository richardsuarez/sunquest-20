import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [
    Header,
    RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {
  constructor(
    private router: Router
  ){
    router.navigate(['/main/customer'])
  }
}
