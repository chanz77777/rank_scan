import { GoogleGenAI } from '@google/genai';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CONTEXT_PATH = path.resolve('PROJECT_CONTEXT.md');

/**
 * Git コマンドを安全に実行するヘルパー
 */
function runGitCommand(command) {
    try {
        return execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch {
        return null;
    }
}

/**
 * PROJECT_CONTEXT.md の同期コミットハッシュのみを置換更新する
 */
function updateSyncedCommitOnly(content, currentCommit) {
    const updated = content.replace(
        /<!-- last_synced_commit:\s*([a-f0-9]+|none)\s*-->/,
        `<!-- last_synced_commit: ${currentCommit} -->`
    );
    fs.writeFileSync(CONTEXT_PATH, updated, 'utf-8');
}

async function main() {
    // 0. 環境変数チェック
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ エラー: GEMINI_API_KEY が設定されていません。');
        process.exit(1);
    }

    // 1. ファイルの存在確認と読み込み
    if (!fs.existsSync(CONTEXT_PATH)) {
        console.error(`❌ エラー: ${CONTEXT_PATH} が見つかりません。`);
        process.exit(1);
    }
    const contextContent = fs.readFileSync(CONTEXT_PATH, 'utf-8');

    // 2. 現在の HEAD ハッシュを取得
    const currentCommit = runGitCommand('git rev-parse HEAD');
    if (!currentCommit) {
        console.error('❌ エラー: Git リポジトリの取得、または HEAD コミットの取得に失敗しました。');
        process.exit(1);
    }

    // 3. 前回同期時のコミットハッシュを取得
    const lastCommitMatch = contextContent.match(/<!-- last_synced_commit:\s*([a-f0-9]+|none)\s*-->/);
    const lastCommit = lastCommitMatch ? lastCommitMatch[1] : 'none';

    if (lastCommit === currentCommit) {
        console.log('✅ コンテキストは最新です（更新の必要はありません）。');
        return;
    }

    // 4. 差分情報を取得
    const diffRange = lastCommit === 'none' ? 'HEAD~1..HEAD' : `${lastCommit}..HEAD`;
    console.log(`📦 差分範囲 (${diffRange}) からコンテキストを更新します...`);

    // 差分取得（除外指定）
    const diffContent = runGitCommand(
        `git diff ${diffRange} -- ":!PROJECT_CONTEXT.md" ":!CHANGELOG*" ":!package-lock.json"`
    );

    // 5. 差分が存在しない場合はメタ情報（コミットハッシュ）のみを更新
    if (!diffContent || !diffContent.trim()) {
        console.log('✨ 対象となるコードの変更差分がありません。同期コミットハッシュのみ更新します。');
        updateSyncedCommitOnly(contextContent, currentCommit);
        console.log(`🎉 同期コミットハッシュを ${currentCommit} に更新しました。`);
        return;
    }

    // 6. Gemini API の呼び出し
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
あなたはプロジェクト管理エージェントです。以下の「現在のコンテキスト」と「コードの差分」をもとに、
PROJECT_CONTEXT.md を最新の状態にアップデートしてください。

【現在のコンテキスト】
${contextContent}

【コードの差分】
${diffContent}

【指示】
1. 差分に基づき、PROJECT_CONTEXT.md の内容（アーキテクチャの変更、新規機能、仕様の更新など）を適切に反映・追記してください。
2. 古い情報は適宜整理し、簡潔で分かりやすいMarkdown形式にまとめてください。
3. ファイルの先頭の <!-- last_synced_commit: ... --> を必ず ${currentCommit} に更新してください。
4. 余計な挨拶や解説文、マークダウンのコードブロック指示(\`\`\`markdown 〜 \`\`\`)は含めず、更新後のMarkdownファイル全体のプレーンテキストのみを出力してください。
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let updatedContent = response.text;

        if (updatedContent) {
            // AIが ```markdown ... ``` で囲んで出力した場合のクレンジング処理
            updatedContent = updatedContent
                .replace(/^```markdown\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/, '')
                .trim();

            fs.writeFileSync(CONTEXT_PATH, updatedContent, 'utf-8');
            console.log(`🎉 PROJECT_CONTEXT.md の更新が完了しました！（同期コミット: ${currentCommit}）`);
        } else {
            console.error('❌ AIからの応答が空でした。');
        }
    } catch (error) {
        console.error('❌ APIの呼び出し中にエラーが発生しました:', error);
        process.exit(1);
    }
}

main();