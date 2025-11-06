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
        pageSize: 20,
    },
    firstCustomerViewed: null,
    lastCustomerViewed: null,
    savingCustomer: false,
    totalPagination: 0,
    appError: null,
}

export const customerReducer = createReducer(
    initialState,
    on(CustomerActions.getNextCustomerListStart, (state) => ({
        ...state,
        loading: true,
        appError: null
    })),
    on(CustomerActions.getNextCustomerListEnd, (state, action) => ({
        ...state,
        loading: false,
        customerList: action.customerList,
        firstCustomerViewed: action.customerList[0], // store a reference to the first customer in the list
        lastCustomerViewed: action.customerList[action.customerList.length - 1], // store a reference to the last customer in the list
        totalPagination: action.total
    })),

    on(CustomerActions.getPreviousCustomerListStart, (state) => ({
        ...state,
        loading: true,
        appError: null
    })),
    on(CustomerActions.getPreviousCustomerListEnd, (state, action) => ({
        ...state,
        loading: false,
        customerList: action.customerList,
        firstCustomerViewed: action.customerList[0], // store a reference to the first customer in the list
        lastCustomerViewed: action.customerList[action.customerList.length - 1], // store a reference to the last customer in the list
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
            adresses: [],
            zipCode: '',
        }
    })),
    on(CustomerActions.loadCustomer, (state, action) => ({
        ...state,
        customerViewModel: action.customer
    })),
    on(CustomerActions.updateSearchCriteria, (state, action) => ({
        ...state,
        searchCriteria: action.criteria
    })),
    on(CustomerActions.resetLastCustomer, (state) => ({
        ...state,
        lastCustomerViewed: null
    })),
    on(CustomerActions.resetCustomerViewModel, (state) => ({
        ...state,
        customerViewModel: null
    })),
    on(CustomerActions.resetSearchCriteria, (state) => ({
        ...state,
        searchCriteria: {
            searchValue: '',
            pageSize: 20,
        },
    }))
    ,
    on(CustomerActions.getVehiclesEnd, (state, action) => ({
        ...state,
        customerViewModel: { 
            ...state.customerViewModel, 
            vehicles: action.vehicles 
        },
    }))
)