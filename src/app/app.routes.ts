import { Routes } from '@angular/router';
import { CanDeactivateGuard } from './shared/can-deactivate-guard.service';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { CUSTOMER_FEATURE_KEY, customerReducer } from './components/customer/store/customer.reducers';
import { CustomerEffects } from './components/customer/store/customer.effects';

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
                providers: [
                    provideState(CUSTOMER_FEATURE_KEY, customerReducer),
                    provideEffects([CustomerEffects]),
                ],
                children: [
                    {
                        path: '',
                        loadComponent() {
                            return import('./components/customer/container/customer').then(m => m.CustomerComponent);
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
