
import { tokenize, PseudoToken } from "../src/index";
import { TOKEN_SAMPLES } from "../test/samples";
import { isPunctuation } from "../src/rules/punctuation";

const sample = TOKEN_SAMPLES.find((s) => s.id === "nextjs-llm");

function tokenizeMergedPunctuation(text: string): PseudoToken[] {
    // 簡易的に既存のtokenizeを使った後、連続する句読点トークンをマージしてカウントしてみる
    const rawTokens = tokenize(text);
    const mergedTokens: PseudoToken[] = [];
    
    let i = 0;
    while (i < rawTokens.length) {
        const t = rawTokens[i];
        
        // もし句読点なら、後続の同じ句読点をスキップするか？
        // いや、tiktokenは "---" を1トークンにするわけではないかもしれないが、
        // 少なくとも頻出する "..." や "---" は専用のトークンがあるかもしれない。
        // ここでは「連続する同じ記号」を1トークンにしてみる実験。
        
        if (isPunctuation(t.text)) {
            let j = i + 1;
            while (j < rawTokens.length && rawTokens[j].text === t.text) {
                j++;
            }
            // i から j-1 までが同じ記号
            // これを1トークンとして扱う（実際にはもう少し複雑だが実験として）
            mergedTokens.push(t);
            i = j;
        } else {
            mergedTokens.push(t);
            i++;
        }
    }
    return mergedTokens;
}

if (sample) {
	const tokens = tokenize(sample.text);
    console.log(`Original count: ${tokens.length}`);
    
    const merged = tokenizeMergedPunctuation(sample.text);
    console.log(`Merged punctuation count: ${merged.length}`);
    console.log(`True count: ${sample.trueTokens}`);
}

