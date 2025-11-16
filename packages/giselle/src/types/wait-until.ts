type WaitUntilTask<T = unknown> = Promise<T> | WaitUntilCallback<T>;
type WaitUntilCallback<T = unknown> = () => T | Promise<T>;
export type WaitUntil<T = unknown> = (task: WaitUntilTask<T>) => void;
