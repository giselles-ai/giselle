type FetchArgs = Parameters<typeof fetch>;
export const fetcher = (...args: FetchArgs) =>
	fetch(...args).then((res) => res.json());

export const typedFetcher = <T>(...args: FetchArgs) =>
	fetch(...args).then((res) => res.json() as T);
