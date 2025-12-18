import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../../shared/firebase/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SeasonPopup } from '../../shared/season/container/season-popup';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit, OnDestroy{

  isMobile!: boolean
  mobileMainMenu = false;
  mobileSubMenu = false;
  desktopMenu = false;
  destroy$ = new Subject<void>()


  constructor(
    private readonly breakpoints: BreakpointObserver,
    private readonly auth: AuthService,
    private readonly matDialog: MatDialog,
  ){}

  ngOnInit(){
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait, 
      Breakpoints.HandsetLandscape
    ]).subscribe(res => {
      this.isMobile = res.matches
    })
  }

  ngOnDestroy(){
    this.destroy$.complete()
  }

  logout(){
    this.auth.logout()
  }

  openSeasonPopup(){
    this.matDialog.open(SeasonPopup)
  }

  toggleMobileMainMenu(){
    this.mobileMainMenu = !this.mobileMainMenu
  }

  toggleMobileSubMenu(){
    this.mobileSubMenu = !this.mobileSubMenu;
  }

  toggleDesktopMenu(){
    this.desktopMenu = !this.desktopMenu;
  }

}

