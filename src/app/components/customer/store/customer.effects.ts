import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { withLatestFrom, switchMap, map, catchError, of, tap, filter, combineLatest, concatMap, from } from 'rxjs';
import { CustomerService } from '../service/customer.service';
import { searchCriteria, lastCustomer, customerViewModel, firstCustomer } from './customer.selectors';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as CustomerActions from './customer.actions';
import { Customer, SearchCriteria } from '../model/customer.model';
import { Router } from '@angular/router';
import { selectSeasons } from '../../main/store/main.selectors';

@Injectable()
export class CustomerEffects {
    private injector = inject(EnvironmentInjector);
    readonly getNextCustomerList$;
    readonly getPreviousCustomerList$;
    readonly getBookingList$;
    readonly addCustomerStart$;
    readonly addCustomerEnd$;
    readonly addVehicleStart$;
    readonly getVehicles$;
    readonly deleteVehicleStart$;
    readonly deleteCustomerStart$;
    readonly deleteCustomerEnd$;
    readonly updateCustomerStart$;
    readonly updateCustomerEnd$;


    constructor(
        private readonly actions$: Actions,
        private readonly customerService: CustomerService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly _snackBar: MatSnackBar,
    ) {

        this.getNextCustomerList$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.getNextCustomerListStart),
                withLatestFrom(this.store.select(searchCriteria), this.store.select(lastCustomer)),
                switchMap(([, criteria, customer]) =>
                    runInInjectionContext(this.injector, () =>
                        from(this.customerService.getNextCustomerList(criteria, customer)).pipe(
                            switchMap((customerList$) =>
                                combineLatest([
                                    customerList$,
                                    from(this.customerService.getCustomerCount(criteria)),
                                ]).pipe(
                                    map(([response, count]) =>
                                        CustomerActions.getNextCustomerListEnd({ customerList: response, total: count })
                                    ),
                                    catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                                )
                            )
                        )
                    )
                )
            )
        );

        this.getPreviousCustomerList$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.getPreviousCustomerListStart),
                withLatestFrom(this.store.select(searchCriteria), this.store.select(firstCustomer)),
                filter((value): value is [ReturnType<typeof CustomerActions.getPreviousCustomerListStart>, SearchCriteria, Customer] => !!value[2]),
                switchMap(([, criteria, customer]) =>
                    runInInjectionContext(this.injector, () =>
                        from(this.customerService.getPreviousCustomerList(criteria, customer)).pipe(
                            switchMap((customerList$) =>
                                customerList$.pipe(
                                    map((response) =>
                                        CustomerActions.getPreviousCustomerListEnd({ customerList: response })
                                    ),
                                    catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                                )
                            )
                        )
                    )
                )
            )
        );

        this.getBookingList$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.getBookingsStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        from(this.customerService.getBookingList(action.customers)).pipe(
                            switchMap((response) =>
                                response.pipe(
                                    map((bookings) =>
                                        CustomerActions.getBookingsEnd({ bookings })
                                    ),
                                    catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                                )
                            ),
                            catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                        )
                    )
                )
            )
        );

        this.addCustomerStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.addCustomerStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.customerService.addCustomer(action.customer).pipe(
                            concatMap((customer) => {
                                const baseActions: any[] = [
                                    CustomerActions.resetCustomerViewModel(),
                                    CustomerActions.addCustomerEnd({ customer: action.customer }),
                                ];

                                // If the action included vehicles, dispatch addVehicleStart for each one
                                if (action.vehicles && action.vehicles.length && customer?.DocumentID) {
                                    const vehicleActions = action.vehicles.map((v: any) =>
                                        CustomerActions.addVehicleStart({ customerId: customer.DocumentID, vehicle: v })
                                    );
                                    baseActions.push(...vehicleActions);
                                    return baseActions;
                                }

                                return baseActions;
                            }),
                            catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                        )
                    )
                )
            )
        );

        this.addCustomerEnd$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.addCustomerEnd),
                tap((action) => {
                    this._snackBar.open(
                        `${action.customer.primaryTitle} ${action.customer.primaryFirstName} ${action.customer.primaryLastName} have been saved`,
                        'Close',
                        { duration: 5000 }
                    );
                    this.router.navigate(['/main/customer']);
                })
            ),
            { dispatch: false }
        );

        this.deleteCustomerStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.deleteCustomerStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.customerService.deleteCustomer(action.id).pipe(
                            map(() => CustomerActions.deleteCustomerEnd({customerId: action.id})),
                            catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                        )
                    )
                )
            )
        );

        this.addVehicleStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.addVehicleStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.customerService.addVehicle(action.customerId, action.vehicle).pipe(
                            map(() => CustomerActions.addVehicleEnd()),
                            catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                        )
                    )
                )
            )
        );

        this.getVehicles$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.getVehiclesStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.customerService.getVehicles(action.customerId).pipe(
                            map((vehicles) => CustomerActions.getVehiclesEnd({ vehicles })),
                            catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                        )
                    )
                )
            )
        );

        this.deleteVehicleStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.deleteVehicleStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.customerService.deleteVehicle(action.customerId, action.vehicleId).pipe(
                            switchMap(() => [
                                CustomerActions.deleteVehicleEnd(),
                                CustomerActions.getVehiclesStart({ customerId: action.customerId }),
                            ]),
                            catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                        )
                    )
                )
            )
        );

        // When a customer is deleted, reset the search criteria and reload the next customer list
        this.deleteCustomerEnd$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.deleteCustomerEnd),
                concatMap(() => [
                    CustomerActions.resetSearchCriteria(),
                    CustomerActions.getNextCustomerListStart(),
                ])
            )
        );

        this.updateCustomerStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.updateCustomerStart),
                withLatestFrom(this.store.select(customerViewModel)),
                switchMap(([action, customerVM]) =>
                    runInInjectionContext(this.injector, () =>
                        this.customerService
                            .updateCustomer({ ...action.customer, DocumentID: customerVM?.DocumentID })
                            .pipe(
                                concatMap(() => {
                                    const baseActions: any[] = [
                                        CustomerActions.resetCustomerViewModel(),
                                        CustomerActions.updateCustomerEnd({ customer: action.customer })
                                    ];

                                    // if vehicles are provided, dispatch addVehicleStart for each
                                    if (action.vehicles && action.vehicles.length && customerVM?.DocumentID) {
                                        const vehicleActions = action.vehicles.map((v: any) =>
                                            CustomerActions.addVehicleStart({ customerId: customerVM.DocumentID!, vehicle: v })
                                        );
                                        return [...baseActions, ...vehicleActions];
                                    }

                                    return baseActions;
                                }),
                                catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                            )
                    )
                )
            )
        );

        this.updateCustomerEnd$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.updateCustomerEnd),
                tap((action) => {
                    this._snackBar.open(
                        `${action.customer.primaryTitle} ${action.customer.primaryFirstName} ${action.customer.primaryLastName} have been updated`,
                        'Close',
                        { duration: 5000 }
                    );
                    this.router.navigate(['/main/customer']);
                })
            ),
            { dispatch: false }
        );
    }
}
