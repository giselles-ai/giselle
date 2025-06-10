import type { ChunkStore } from "../chunk-store/types";
import type { Chunker } from "../chunker/types";
import type {
	Document,
	DocumentLoader,
	DocumentLoaderParams,
} from "../document-loader/types";
import type { Embedder } from "../embedder/types";
import { OperationError } from "../errors";

export interface IngestPipelineConfig<
	TSourceMetadata extends Record<string, unknown>,
	TTargetMetadata extends Record<string, unknown> = TSourceMetadata,
> {
	documentLoader: DocumentLoader<TSourceMetadata>;
	chunker: Chunker;
	embedder: Embedder;
	chunkStore: ChunkStore<TTargetMetadata>;
	// メタデータ変換関数（省略可能）
	metadataTransform?: (metadata: TSourceMetadata) => TTargetMetadata;
	// オプション設定
	options?: {
		batchSize?: number; // 埋め込みのバッチサイズ
		maxRetries?: number; // リトライ回数
		retryDelay?: number; // リトライ間隔（ミリ秒）
		onProgress?: (progress: IngestProgress) => void;
		onError?: (error: IngestError) => void;
	};
}

export interface IngestProgress {
	totalDocuments: number;
	processedDocuments: number;
	currentDocument?: string;
	totalChunks: number;
	processedChunks: number;
}

export interface IngestError {
	document: string;
	error: Error;
	willRetry: boolean;
	attemptNumber: number;
}

export interface IngestResult {
	totalDocuments: number;
	successfulDocuments: number;
	failedDocuments: number;
	totalChunks: number;
	errors: Array<{ document: string; error: Error }>;
}

export class IngestPipeline<
	TSourceMetadata extends Record<string, unknown>,
	TTargetMetadata extends Record<string, unknown> = TSourceMetadata,
> {
	private documentLoader: DocumentLoader<TSourceMetadata>;
	private chunker: Chunker;
	private embedder: Embedder;
	private chunkStore: ChunkStore<TTargetMetadata>;
	private metadataTransform?: (metadata: TSourceMetadata) => TTargetMetadata;
	private options: Required<
		NonNullable<IngestPipelineConfig<TSourceMetadata, TTargetMetadata>["options"]>
	>;

	constructor(config: IngestPipelineConfig<TSourceMetadata, TTargetMetadata>) {
		this.documentLoader = config.documentLoader;
		this.chunker = config.chunker;
		this.embedder = config.embedder;
		this.chunkStore = config.chunkStore;
		this.metadataTransform = config.metadataTransform;
		this.options = {
			batchSize: 100,
			maxRetries: 3,
			retryDelay: 1000,
			onProgress: () => {},
			onError: () => {},
			...config.options,
		};
	}

	async ingest(params: unknown): Promise<IngestResult> {
		const result: IngestResult = {
			totalDocuments: 0,
			successfulDocuments: 0,
			failedDocuments: 0,
			totalChunks: 0,
			errors: [],
		};

		const progress: IngestProgress = {
			totalDocuments: 0,
			processedDocuments: 0,
			totalChunks: 0,
			processedChunks: 0,
		};

		try {
			// ドキュメントを処理
			for await (const document of this.documentLoader.load(
				params as DocumentLoaderParams,
			)) {
				result.totalDocuments++;
				progress.totalDocuments++;
				progress.currentDocument = this.getDocumentKey(document);

				try {
					await this.processDocument(document);
					result.successfulDocuments++;
					progress.processedDocuments++;
				} catch (error) {
					result.failedDocuments++;
					result.errors.push({
						document: progress.currentDocument,
						error: error instanceof Error ? error : new Error(String(error)),
					});
				}

				this.options.onProgress(progress);
			}
		} catch (error) {
			throw OperationError.invalidOperation(
				"ingestion pipeline",
				"Failed to complete ingestion pipeline",
				{ cause: error instanceof Error ? error.message : String(error) },
			);
		}

		return result;
	}

	private async processDocument(document: Document<TSourceMetadata>): Promise<void> {
		const documentKey = this.getDocumentKey(document);

		// メタデータ変換を適用
		const targetMetadata = this.metadataTransform 
			? this.metadataTransform(document.metadata)
			: document.metadata as unknown as TTargetMetadata;

		// リトライロジック
		for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
			try {
				// チャンキング
				const chunkTexts = this.chunker.chunk(document.content);

				// バッチ埋め込み
				const chunks = [];
				for (let i = 0; i < chunkTexts.length; i += this.options.batchSize) {
					const batch = chunkTexts.slice(i, i + this.options.batchSize);
					const embeddings = await this.embedder.embedBatch(batch);

					for (let j = 0; j < batch.length; j++) {
						chunks.push({
							content: batch[j],
							index: i + j,
							embedding: embeddings[j],
						});
					}
				}

				// 変換されたメタデータで保存
				await this.chunkStore.insert(documentKey, chunks, targetMetadata);
				return; // 成功したら終了
			} catch (error) {
				const isLastAttempt = attempt === this.options.maxRetries;

				this.options.onError({
					document: documentKey,
					error: error instanceof Error ? error : new Error(String(error)),
					willRetry: !isLastAttempt,
					attemptNumber: attempt,
				});

				if (isLastAttempt) {
					throw error;
				}

				// 指数バックオフ
				const delay = this.options.retryDelay * 2 ** (attempt - 1);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	private getDocumentKey(document: Document<TSourceMetadata>): string {
		// メタデータから適切なキーを生成
		// 実装によって異なるが、一般的にはパスやIDを使用
		const metadata = document.metadata as Record<string, unknown>;
		if (typeof metadata.path === "string") return metadata.path;
		if (typeof metadata.id === "string") return metadata.id;
		if (typeof metadata.url === "string") return metadata.url;
		return "unknown";
	}
}
