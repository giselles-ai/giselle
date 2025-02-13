import { createId } from "@paralleldrive/cuid2";

let temporaryId = -1;
/**
 * Creates a temporary ID using cuid2 library
 * @returns {number} A negative number to be used as a temporary ID
 */
export const createTemporaryId = (): number => {
	temporaryId--;
	return temporaryId;
};
