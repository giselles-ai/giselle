export interface DatabaseConfig {
	connectionString: string;
	poolConfig?: {
		max?: number;
		idleTimeoutMillis?: number;
		connectionTimeoutMillis?: number;
	};
}

// 必須カラムの定義
export interface RequiredColumns {
	documentKey: string;
	content: string;
	index: string;
	embedding: string;
}

// カラムマッピングの型定義（必須カラムを強制）
export type ColumnMapping<TMetadata> = RequiredColumns & {
	[K in keyof TMetadata]: string;
};
