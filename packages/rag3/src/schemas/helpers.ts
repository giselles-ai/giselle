import { z } from "zod/v4";
import type { ColumnMapping } from "../database/types";

/**
 * 文字列をsnake_caseに変換
 */
function toSnakeCase(str: string): string {
	return str
		.replace(/([A-Z])/g, "_$1")
		.toLowerCase()
		.replace(/^_/, "");
}

/**
 * ケース変換のオプション
 */
export type CaseConversion = "snake_case" | "camelCase" | "none";

/**
 * ColumnMapping生成のオプション
 */
export interface CreateColumnMappingOptions {
	/**
	 * カラム名のケース変換方式
	 * @default "snake_case"
	 */
	caseConversion?: CaseConversion;
	/**
	 * カスタムマッピング（個別のフィールドのマッピングをオーバーライド）
	 */
	customMappings?: Partial<Record<string, string>>;
	/**
	 * 必須カラムのマッピング（デフォルト値をオーバーライド）
	 */
	requiredColumns?: {
		documentKey?: string;
		content?: string;
		index?: string;
		embedding?: string;
	};
}

/**
 * ZodスキーマからColumnMappingを自動生成
 * @param schema メタデータのZodスキーマ
 * @param options 生成オプション
 * @returns ColumnMapping
 */
export function createColumnMappingFromZod<
	TSchema extends z.ZodObject<z.ZodRawShape>,
>(
	schema: TSchema,
	options: CreateColumnMappingOptions = {},
): ColumnMapping<z.infer<TSchema>> {
	const {
		caseConversion = "snake_case",
		customMappings = {},
		requiredColumns = {},
	} = options;

	// デフォルトの必須カラム
	const defaultRequiredColumns = {
		documentKey: "document_key",
		content: "content",
		index: "index",
		embedding: "embedding",
	};

	// 必須カラムをマージ
	const finalRequiredColumns = {
		...defaultRequiredColumns,
		...requiredColumns,
	};

	// ケース変換関数を選択
	const convertCase = (fieldName: string): string => {
		switch (caseConversion) {
			case "snake_case":
				return toSnakeCase(fieldName);
			case "camelCase":
				return fieldName; // すでにcamelCaseと仮定
			case "none":
				return fieldName;
			default:
				return toSnakeCase(fieldName);
		}
	};

	// メタデータフィールドのマッピングを生成
	const metadataMapping: Record<string, string> = {};
	const schemaShape = schema.shape;

	for (const fieldName of Object.keys(schemaShape)) {
		// カスタムマッピングが定義されている場合はそれを使用
		if (customMappings[fieldName]) {
			metadataMapping[fieldName] = customMappings[fieldName];
		} else {
			// それ以外はケース変換を適用
			metadataMapping[fieldName] = convertCase(fieldName);
		}
	}

	// 完全なColumnMappingを構築
	return {
		...finalRequiredColumns,
		...metadataMapping,
	} as ColumnMapping<z.infer<TSchema>>;
}

/**
 * 自動的にtype判別子を追加したスキーマを作成
 * @param schema 元のメタデータスキーマ
 * @param typeName type判別子の値
 * @returns type判別子が追加されたスキーマ
 */
export function addTypeDiscriminator<
	TSchema extends z.ZodObject<z.ZodRawShape>,
>(schema: TSchema, typeName: string) {
	return schema.extend({
		type: z.literal(typeName),
	});
}

/**
 * メタデータの検証を実行するヘルパー関数
 * @param metadata 検証するメタデータ
 * @param schema Zodスキーマ
 * @returns 検証済みのメタデータ
 * @throws ValidationError 検証に失敗した場合
 */
export function validateMetadata<T>(
	metadata: unknown,
	schema: z.ZodType<T>,
): T {
	const result = schema.safeParse(metadata);
	if (!result.success) {
		throw new Error(
			`Metadata validation failed: ${JSON.stringify(result.error.issues)}`,
		);
	}
	return result.data;
}
