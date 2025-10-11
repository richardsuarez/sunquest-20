import { createAction, props } from "@ngrx/store";
import { Customer, SearchCriteria } from "../model/customer.model";

export const getCustomerListStart = createAction(
    '[Customer] Start retrieving customer list'
);

export const getCustomerListEnd = createAction(
    '[Customer] End retrieving customer list',
    props<{ customerList: Customer[] }>()
);

export const failure = createAction(
    '[Customer] Failure',
    props<{appError: Error}>()
);

export const addCustomerStart = createAction(
    '[Customer] Start adding new customer',
    props<{customer: Partial<Customer>}>()
);

export const addCustomerEnd = createAction(
    '[Customer] End add new customer',
);

export const updateCustomerStart = createAction(
    '[Customer] Start updating customer',
    props<{customer: Partial<Customer>}>()
);

export const updateCustomerEnd = createAction(
    '[Customer] End updating customer',
);

export const deleteCustomerStart = createAction(
    '[Customer] Start deleting customer',
    props<{id: string}>()
);

export const deleteCustomerEnd = createAction(
    '[Customer] End add new customer',
);

export const createCustomer = createAction(
    '[Customer] Create an empty customer in state'
);

export const loadCustomer = createAction(
    '[Customer] Load a customer in state',
    props<{customer: Partial<Customer>}>()
);

export const updateSearchCriteria = createAction(
    '[Customer] Update search criteria',
    props<{criteria: SearchCriteria}>()
)




