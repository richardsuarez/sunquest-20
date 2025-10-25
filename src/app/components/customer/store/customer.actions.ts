import { createAction, props } from "@ngrx/store";
import { Customer, SearchCriteria, Vehicle } from "../model/customer.model";

export const getNextCustomerListStart = createAction(
    '[Customer] Start retrieving the next customer list'
);

export const getNextCustomerListEnd = createAction(
    '[Customer] End retrieving the next customer list',
    props<{ customerList: Customer[], total: number }>()
);

export const getPreviousCustomerListStart = createAction(
    '[Customer] Start retrieving the previous customer list'
);

export const getPreviousCustomerListEnd = createAction(
    '[Customer] End retrieving the previous customer list',
    props<{ customerList: Customer[] }>()
);

export const failure = createAction(
    '[Customer] Failure',
    props<{appError: Error}>()
);

export const addCustomerStart = createAction(
    '[Customer] Start adding new customer',
    props<{customer: Partial<Customer>, vehicles?: Partial<Vehicle>[]}>()
);

export const addCustomerEnd = createAction(
    '[Customer] End add new customer',
    props<{customer: Partial<Customer>}>()
);

export const updateCustomerStart = createAction(
    '[Customer] Start updating customer',
    props<{customer: Partial<Customer>, vehicles?: Partial<Vehicle>[]}>()
);

export const updateCustomerEnd = createAction(
    '[Customer] End updating customer',
    props<{customer: Partial<Customer>}>()
);

export const deleteCustomerStart = createAction(
    '[Customer] Start deleting customer',
    props<{id: string}>()
);

export const deleteCustomerEnd = createAction(
    '[Customer] End delete customer',
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
);

export const resetLastCustomer = createAction(
    '[Customer] Reset last customer'
);

export const resetCustomerViewModel = createAction(
    '[Customer] Reset customer view model'
);

export const resetSearchCriteria = createAction(
    '[Customer] Reset search criteria'
)

export const addVehicleStart = createAction(
    '[Customer] Start adding vehicle',
    props<{ customerId: string, vehicle: Partial<Vehicle>}>()
);

export const addVehicleEnd = createAction(
    '[Customer] End adding vehicle'
);

export const getVehiclesStart = createAction(
    '[Customer] Start loading vehicles',
    props<{ customerId: string }>()
);

export const getVehiclesEnd = createAction(
    '[Customer] End loading vehicles',
    props<{ customerId: string, vehicles: Vehicle[] }>()
);

export const deleteVehicleStart = createAction(
    '[Customer] Start deleting vehicle',
    props<{ customerId: string, vehicleId: string }>()
);

export const deleteVehicleEnd = createAction(
    '[Customer] End deleting vehicle'
);




