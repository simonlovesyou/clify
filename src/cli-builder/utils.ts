import { ParsedFunction } from ".";
import { getValidationMethod } from "./builders";

export const getUniqueTypes = (parsedFunction: ParsedFunction) =>
  parsedFunction.parameters.reduce(
    (acc, { type }) => (acc.includes(type) ? acc : [...acc, type]),
    []
  );