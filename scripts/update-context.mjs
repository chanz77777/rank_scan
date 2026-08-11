import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CONTEXT_PATH = path.resolve('PROJECT_CONTEXT.md');

// 1. 現在の PROJECT_CONTEXT.md を読み込む
const contextContent = fs.readFileSync(CONTEXT_PATH, 'utf-8');

// 2. 前回同期時のコミットハッシュを取得
const lastCommitMatch = contextContent.match(/<!-- last_synced_commit:\s*([a-f0-9]+|none)\s*-->/);
const lastCommit = lastCommitMatch ? lastCommitMatch[1] : 'none';

// 3. 現在の HEAD ハッシュを取得
const currentCommit = execSync('git rev-parse HEAD').toString().trim();

if (lastCommit === currentCommit) {
    console.log('✅ コンテキストは最新です。');
    process.exit(0);
}

// 4. 差分情報を取得 (ファイル名と変更内容のサマリー)
const diffRange = lastCommit === 'none' ? 'HEAD~1..HEAD' : `${lastCommit}..HEAD`;
const diffSummary = execSync(`git diff ${diffRange} --stat`).toString();
const diffContent = execSync(`git diff ${diffRange} -- ":!PROJECT_CONTEXT.md" ":!CHANGELOG*"`).toString();

console.log(`📦 差分コミット範囲: ${diffRange}`);

// 5. 【重要】ここからAIへのプロンプト生成
const prompt = `
あなたはプロジェクト管理エージェントです。以下の「現在のコンテキスト」と「コードの差分」をもとに、
PROJECT_CONTEXT.md を最新の状態にアップデートしてください。

【現在のコンテキスト】
${contextContent}

【コードの差分】
${diffContent}

【指示】
1. 差分に基づき、PROJECT_CONTEXT.md の「直近のアーキテクチャ・仕様メモ」セクションを更新・追記してください。
2. 古い情報は適宜整理し、簡潔にまとめてください。
3. ファイルの先頭の <!-- last_synced_commit: ... --> を ${currentCommit} に更新してください。
4. Markdown形式で出力してください。
`;

// 実際の実装では、ここで process.env.GEMINI_API_KEY を使ってAPIを叩き、
// 返ってきた結果を fs.writeFileSync(CONTEXT_PATH, newContent) で保存します。
console.log('🚀 AIによるコンテキスト更新プロンプトを生成しました。');
console.log('--- プロンプトのプレビュー ---');
console.log(prompt);