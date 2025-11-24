import { Routes } from '@angular/router';
import { CanDeactivateGuard } from './shared/can-deactivate-guard.service';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { CUSTOMER_FEATURE_KEY, customerReducer } from './components/customer/store/customer.reducers';
import { CustomerEffects } from './components/customer/store/customer.effects';
import { bookReducer } from './components/book/store/book.reducers';
import { BookEffects } from './components/book/store/book.effects';
import { truckReducer, TRUCK_FEATURE_KEY } from './components/truck/store/truck.reducers';
import { TruckEffects } from './components/truck/store/truck.effects';

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
                    return import('./components/trip/trip').then(m => m.trip);
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
                    provideState(TRUCK_FEATURE_KEY, truckReducer),
                    provideEffects([BookEffects, TruckEffects]),
                ],
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./components/book/container/book').then(m => m.Book),
                    },
                    {
                        path: ':crud',
                        loadComponent(){
                            return import('./components/book/book-edit/book-edit').then(m => m.BookEdit);
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
            }
        ]
    }
];
