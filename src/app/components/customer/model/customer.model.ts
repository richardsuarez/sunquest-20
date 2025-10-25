export interface Customer {
    DocumentID: string;
    primaryFirstName: string | null;
    primaryLastName: string | null;
    primaryMiddleName: string | null;
    primaryTitle: string | null;
    secondaryFirstName: string | null;
    secondaryLastName: string | null;
    secondaryMiddleName: string | null;
    secondaryTitle: string | null;
    email: string | null;
    telephone: string | null;
    phone: string | null;
    floridaAddress: Address;
    newYorkAddress: Address;
    joinedOn: Date | null;
    vehicles?: Vehicle[];
}

export interface SearchCriteria {
    searchValue: string;
    pageSize: number
}

export interface Address{
    address1: string | null;
    address2: string | null;
    bldg: string | null;
    apt: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
}

export interface Vehicle {
    id?: string;
    make: string | null;
    model: string | null;
    year: number | null;
    plate: string | null;
    state: string | null;
    vin: string | null;
    color: string | null;
    weight: number | null;
    createdAt?: any;
}