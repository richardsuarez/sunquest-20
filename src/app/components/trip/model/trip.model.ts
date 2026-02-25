export interface Trip {
  id?: string;
  loadNumber: string;
  departureDate: Date;
  arrivalDate: Date;
  origin: string;
  destination: string;
  remLoadCap: number;  // remaining load capacity
  remCarCap: number;   // remaining car capacity
  delayDate: Date | null;
  season: string | null;
  paidBookings: number;
}