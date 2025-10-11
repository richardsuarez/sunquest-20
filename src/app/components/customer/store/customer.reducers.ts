import { createReducer, on } from "@ngrx/store";
import { CustomerState } from "./customer.state";

import * as CustomerActions from './customer.actions'

export const CUSTOMER_FEATURE_KEY = 'customer';

const initialState: CustomerState = {
    loading: false,
    customerList: [],
    customerViewModel: null,
    searchCriteria: {
        searchValue: '',
        pagination: {
            page: 1,
            pageSize: 2,
        }
    },
    lastCustomer: null,
    savingCustomer: false,
    appError: null,
}

export const customerReducer = createReducer(
    initialState,
    on(CustomerActions.getCustomerListStart, (state) => ({
        ...state,
        loading: true,
        appError: null
    })),
    on(CustomerActions.getCustomerListEnd, (state, action) => ({
        ...state,
        loading: false,
        customerList: action.customerList
    })),

    on(CustomerActions.failure, (state, action) => ({
        ...state,
        loading: false,
        appError: action.appError
    })),

    on(CustomerActions.addCustomerStart, (state) => ({
        ...state,
        savingCustomer: true,
        appError: null
    })),
    on(CustomerActions.addCustomerEnd, (state) => ({
        ...state,
        savingCustomer: false,
    })),
    on(CustomerActions.updateCustomerStart, (state) => ({
        ...state,
        savingCustomer: true,
        appError: null,
    })),
    on(CustomerActions.updateCustomerEnd, (state) => ({
        ...state,
        savingCustomer: false
    })),
    on(CustomerActions.deleteCustomerStart, (state) => ({
        ...state,
        loading: true,
        appError: null,
    })),
    on(CustomerActions.deleteCustomerEnd, (state) => ({
        ...state,
        loading: false
    })),
    on(CustomerActions.createCustomer, (state) => ({
        ...state,
        customerViewModel: {
            id: new Date().toISOString(),
            primaryFirstName: '',
            primaryLastName: '',
            primaryMiddleName: '',
            primaryTitle: '',
            secondaryFirstName: '',
            secondaryLastName: '',
            secondaryMiddleName: '',
            secondaryTitle: '',
            email: '',
            telephone: '',
            phone: '',
            address1: '',
            address2: '',
            bldg: '',
            apt: '',
            city: '',
            state: '',
            zipCode: '',
        }
    })),
    on(CustomerActions.loadCustomer, (state, action) => ({
        ...state,
        customerViewModel: action.customer
    }))
)