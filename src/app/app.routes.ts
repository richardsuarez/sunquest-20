import { Routes } from '@angular/router';
import { CanDeactivateGuard } from './shared/can-deactivate-guard.service';

export const routes: Routes = [
    {
        path: '',
        loadComponent() {
            return import('./components/login/login').then(m => m.Login);
        },
    },
    {
        path: 'main',
        loadComponent() {
            return import('./components/main/main').then(m => m.Main);
        },
        children: [
            {
                path: '',
                loadComponent() {
                    return import('./components/dashboard/dashboard').then(m => m.Dashboard);
                }
            },
            {
                path: 'customer',
                children: [
                    {
                        path: '',
                        loadComponent() {
                            return import('./components/customer/customer').then(m => m.Customer);
                        },
                    },
                    {
                        path: ':crud',
                        loadComponent() {
                            return import('./components/customer/customer-edit/customer-edit').then(m => m.CustomerEdit);
                        },
                        canDeactivate: [
                            CanDeactivateGuard
                        ]
                    }
                ]
            },
            {
                path: 'book',
                loadComponent() {
                    return import('./components/book/book').then(m => m.Book);
                }
            }
        ]
    }
];
