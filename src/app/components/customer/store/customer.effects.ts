import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { withLatestFrom, switchMap, map, catchError, of } from "rxjs";
import { CustomerService } from "../service/customer.service";
import { searchCriteria, lastCustomer, customerViewModel } from "./customer.selectors";

import * as CustomerActions from './customer.actions'
import { Customer } from "../model/customer.model";

@Injectable()
export class CustomerEffects {
    readonly getCustomerList$;
    readonly addCustomer$;
    readonly deleteCustomer$;
    readonly updateCustomer$;

    constructor(
        private readonly actions$: Actions,
        private readonly customerService: CustomerService,
        private readonly store: Store
    ) {
        // ✅ Define effects *after* DI constructor runs
        this.getCustomerList$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.getCustomerListStart),
                withLatestFrom(
                    this.store.select(searchCriteria),
                    this.store.select(lastCustomer)
                ),
                switchMap(([, criteria, customer]) =>
                    this.customerService.getCustomerList(criteria, customer).pipe(
                        map((response) => {
                            return CustomerActions.getCustomerListEnd({ customerList: response })
                        }),
                        catchError((error: Error) => {
                            return of(CustomerActions.failure({ appError: error }))
                        })
                    )
                )
            )
        );

        this.addCustomer$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.addCustomerStart),
                switchMap((action) => {
                    return this.customerService.addCustomer(action.customer).pipe(
                        map(() => CustomerActions.addCustomerEnd()),
                        catchError((error: Error) =>
                            of(CustomerActions.failure({ appError: error }))
                        )
                    )
                })
            )
        );

        this.deleteCustomer$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.deleteCustomerStart),
                switchMap((action) =>
                    this.customerService.deleteCustomer(action.id).pipe(
                        map(() => CustomerActions.deleteCustomerEnd()),
                        catchError((error: Error) =>
                            of(CustomerActions.failure({ appError: error }))
                        )
                    )
                )
            )
        );

        this.updateCustomer$ = createEffect(() =>
            this.actions$.pipe(
                ofType(CustomerActions.updateCustomerStart),
                withLatestFrom(this.store.select(customerViewModel)),
                switchMap(([action, customerVM]) =>
                    this.customerService.updateCustomer({...action.customer, DocumentID: customerVM?.DocumentID}).pipe(
                        map(() => CustomerActions.updateCustomerEnd()),
                        catchError((error: Error) =>
                            of(CustomerActions.failure({ appError: error }))
                        )
                    )
                )
            )
        );
    }
}
