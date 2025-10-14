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

@Injectable()
export class CustomerEffects {
    private injector = inject(EnvironmentInjector);
    readonly getNextCustomerList$;
    readonly getPreviousCustomerList$;
    readonly addCustomerStart$;
    readonly addCustomerEnd$;
    readonly deleteCustomer$; 
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

        this.addCustomerStart$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.addCustomerStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.customerService.addCustomer(action.customer).pipe(
                            concatMap(() => [
                                CustomerActions.resetCustomerViewModel(),
                                CustomerActions.addCustomerEnd({ customer: action.customer }),
                            ]),
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

        this.deleteCustomer$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.deleteCustomerStart),
                switchMap((action) =>
                    runInInjectionContext(this.injector, () =>
                        this.customerService.deleteCustomer(action.id).pipe(
                            map(() => CustomerActions.deleteCustomerEnd()),
                            catchError((error: Error) => of(CustomerActions.failure({ appError: error })))
                        )
                    )
                )
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
                                concatMap(() =>[
                                    CustomerActions.resetCustomerViewModel(),
                                    CustomerActions.updateCustomerEnd({ customer: action.customer })
                                ]),
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
