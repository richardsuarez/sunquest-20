import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../../shared/firebase/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SeasonPopup } from '../season/container/season-popup';

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
export class Header implements OnInit, OnDestroy, AfterViewInit {

  isMobile!: boolean
  mobileMainMenu = false;
  mobileSubMenu = false;
  showReportMenu = false;
  reportMenuPosition = {
    top: 0,
    left: 0,
  }
  desktopMenu = false;
  destroy$ = new Subject<void>()


  constructor(
    private readonly breakpoints: BreakpointObserver,
    private readonly auth: AuthService,
    private readonly matDialog: MatDialog,
  ) { }

  ngOnInit() {
    this.breakpoints.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).subscribe(res => {
      this.isMobile = res.matches
    });
  }

  ngAfterViewInit() {
    const container = document.getElementById('sub-container') as HTMLElement | null;
    const headerEl = document.getElementById('report-menu-header') as HTMLElement | null;
    const reportMenuEl = document.getElementById('report-menu') as HTMLElement | null;

    if (!container || !headerEl || !reportMenuEl) return;

    const headerRect = headerEl.getBoundingClientRect();
    const menuWidth = 150; // matches style="width: 100px;" in template

    this.reportMenuPosition = {
      top: Math.round(container.getBoundingClientRect().bottom), // distance from viewport top
      left: Math.round(headerRect.left + (headerRect.width - menuWidth) / 2)
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete()
  }

  getProperties(event: any) {
    console.log(event);
  }

  logout() {
    this.auth.logout()
  }

  openSeasonPopup() {
    this.matDialog.open(SeasonPopup)
  }

  toggleMobileMainMenu() {
    this.mobileMainMenu = !this.mobileMainMenu
  }

  toggleMobileSubMenu() {
    this.mobileSubMenu = !this.mobileSubMenu;
  }

  toggleReportMenu() {
    this.showReportMenu = !this.showReportMenu;
    if (this.showReportMenu) {
      setTimeout(() => this.ngAfterViewInit(), 0);
    }
  }

}

