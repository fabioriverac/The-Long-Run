import { useContext } from "react";
import { GymContext } from "./gym-context.js";

export function useGymData() {
  const value = useContext(GymContext);
  if (!value) throw new Error("useGymData must be used inside the gym");
  return value;
}
