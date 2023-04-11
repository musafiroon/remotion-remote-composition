import invariant from "tiny-invariant";

/**
 * Given a condition/value, ensure it is truthy, else throw an error
 */
export const assert = <TOptional>(condition: TOptional, message?: string | (() => string)): NonNullable<TOptional> => {
  invariant(
    condition,
    typeof message === "string"
      ? `AssertError: ${message}`
      : message || `AssertError: condition must be truthy`
  );
  const _condition = condition as NonNullable<TOptional>;
  return _condition;
};