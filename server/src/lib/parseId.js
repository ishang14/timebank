import { httpError } from './httpError.js';

const MAX_ID = 2147483647; // largest value of the database's integer ids

// Turns a URL parameter into an id, or throws a 404 (so "abc" or "99999999999" never reach the database)
export function parseId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > MAX_ID) throw httpError(404, `${name} not found`);
  return id;
}
