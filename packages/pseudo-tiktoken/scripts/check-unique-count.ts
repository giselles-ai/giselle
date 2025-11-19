
import { tokenize } from "../src/index";
import { TOKEN_SAMPLES } from "../test/samples";

const sample = TOKEN_SAMPLES.find((s) => s.id === "nextjs-llm");
if (sample) {
	const tokens = tokenize(sample.text);
	console.log(`Total tokens (current implementation): ${tokens.length}`);
	console.log(`True tokens (tiktoken): ${sample.trueTokens}`);

	// Calculate unique tokens (naive approach: unique text segments)
	const uniqueTokens = new Set(tokens.map(t => t.text));
	console.log(`Unique token segments count: ${uniqueTokens.size}`);
    
    // もしユーザーが「同じ単語は2回目以降カウントしない」を意図しているなら、
    // それは Unique Token Count とほぼ同義（構成要素のユニーク数）。
    // ただし、tokenizeの結果は「分割されたサブワード」なので、
    // 「元の単語」レベルでのユニーク化なのか、「トークン（サブワード）」レベルなのかでも変わる。
    // いったんトークン（サブワード）レベルのユニーク数を出してみる。

} else {
	console.error("Sample not found");
}

