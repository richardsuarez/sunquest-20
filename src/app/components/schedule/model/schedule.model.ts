export interface Schedule {
  id?: string;
  truckId: string;
  loadNumber: string;
  departureDate: Date;
  origin: string;
  destination: string;
  remLoadCap: number;  // remaining load capacity
  remCarCap: number;   // remaining car capacity
  createdAt?: Date;
}