import {
  findPlaceById,
  listPlaces,
} from "@/server/repositories/place.repository";

export function getPlaces() {
  return listPlaces();
}

export function getPlaceById(id: string) {
  return findPlaceById(id);
}