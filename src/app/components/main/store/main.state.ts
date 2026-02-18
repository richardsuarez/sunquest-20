import { Customer } from "../../customer/model/customer.model";
import { Season } from "../../season/models/season.model";

export interface MainState {
  customers: Customer[];
  seasons: Season[];
  loading: boolean;
  error: string | null;
  isMobile: boolean
}

export const initialMainState: MainState = {
  customers: [],
  seasons: [],
  loading: false,
  error: null,
  isMobile: false,
};
