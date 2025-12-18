import { Season } from "../../../shared/season/models/season.model";

export interface MainState {
  seasons: Season[];
  loading: boolean;
  error: string | null;
}

export const initialMainState: MainState = {
  seasons: [],
  loading: false,
  error: null
};
