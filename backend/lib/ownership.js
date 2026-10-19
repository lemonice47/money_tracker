import { ApiError } from "./api";

// Find a document by id that belongs to the user, or throw 404.
// Returning 404 (not 403) avoids revealing other users' ids.
export async function findOwned(Model, id, userId) {
  const doc = await Model.findOne({ _id: id, userId });
  if (!doc) throw new ApiError(404, `${Model.modelName} not found`);
  return doc;
}