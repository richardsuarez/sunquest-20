import { Routes } from '@angular/router';
import { CanDeactivateGuard } from './shared/can-deactivate-guard.service';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { CUSTOMER_FEATURE_KEY, customerReducer } from './components/customer/store/customer.reducers';
import { CustomerEffects } from './components/customer/store/customer.effects';
import { bookReducer } from './components/book/store/book.reducers';
import { BookEffects } from './components/book/store/book.effects';
import { CalendarEffects } from './components/calendar/store/calendar.effects';
import { truckReducer, TRUCK_FEATURE_KEY } from './components/truck/store/truck.reducers';
import { TruckEffects } from './components/truck/store/truck.effects';
import { calendarReducer } from './components/calendar/store/calendar.reducers';
import { mainReducer } from './components/main/store/main.reducers';
import { MainEffects } from './components/main/store/main.effects';
import { reportReducer } from './components/report/store/report.reducers';
import { ReportEffects } from './components/report/store/report.effects';
import { loginReducers } from './components/login/store/login.reducers';
import { LoginEffects } from './components/login/store/login.effects';

export const routes: Routes = [
    {
        path: '',
        providers: [
            provideState('login', loginReducers),
            provideEffects([LoginEffects]),
        ],
        loadComponent() {
            return import('./components/login/login').then(m => m.Login);
        },
    },
    {
        path: 'main',
        providers: [
            provideState('main', mainReducer),
            provideEffects([MainEffects]),
        ],
        loadComponent() {
            return import('./components/main/container/main').then(m => m.Main);
        },
        children: [
            {
                path: 'calendar',
                providers: [
                    // provide book feature state and effects when /main/calendar is active
                    provideState('calendar', calendarReducer),
                    provideEffects([CalendarEffects])
                ],
                loadComponent() {
                    return import('./components/calendar/container/calendar').then(m => m.Calendar);
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
                providers: [
                    // provide book feature state and effects when /main/book is active
                    provideState('book', bookReducer),
                    provideEffects([BookEffects,]),
                ],
                children: [
                    {
                        path: ':crud',
                        loadComponent() {
                            return import('./components/book/container/book').then(m => m.Book);
                        },
                        canDeactivate: [
                            CanDeactivateGuard
                        ]
                    }
                ]
            }
            ,
            {
                path: 'truck',
                providers: [
                    provideState(TRUCK_FEATURE_KEY, truckReducer),
                    provideEffects([TruckEffects]),
                ],
                loadComponent() {
                    return import('./components/truck/container/truck').then(m => m.TruckList);
                }
            },
            {
                path: 'report',
                children: [
                    {
                        path: 'work',
                        loadComponent() {
                            return import('./components/report/work-order/container/work-order').then(m => m.WorkOrder);
                        },
                    },
                    {
                        path: 'customer',
                        loadComponent() {
                            return import('./components/report/customer-report/customer-report').then((m => m.CustomerReport))
                        },
                    },
                    {
                        path: 'payment',
                        loadComponent() {
                            return import('./components/report/payment-report/container/payment-report').then((m => m.PaymentReport))
                        },
                    }
                ],
                providers: [
                    provideState('report', reportReducer),
                    provideEffects([ReportEffects]),
                ],
            }
        ]
    }
];
