export interface StorageClient {
	put(keyName: string, keyValue: string): void | Promise<void>;
	get(keyName: string): (string | null) | Promise<string | null>;
}

interface StorageConfigurationBase {
	type: string;
	directory?: string;
}

export interface BrowserLocalStorageConfiguration
	extends StorageConfigurationBase {
	type: "localstorage";
}

export interface LocalFileSystemStorageConfiguration
	extends StorageConfigurationBase {
	type: "localfilesystem";
}

export interface RemoteStorageConfigurationBase
	extends StorageConfigurationBase {
	type: "remote";
	provider: string;
}

export interface VercelBlobStorageConfiguration
	extends RemoteStorageConfigurationBase {
	provider: "vercel-blob";
}

export type StorageConfiguration =
	| BrowserLocalStorageConfiguration
	| LocalFileSystemStorageConfiguration
	| VercelBlobStorageConfiguration;
