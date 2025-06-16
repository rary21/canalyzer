# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## 言語

コメントやドキュメントでは必ず日本語を使ってください。

## 品質保証ルール

### 作業完了時の必須手順

作業を終了する際は、必ず以下の手順を実行してコードの品質を保証してください：

#### 1. フォーマッター実行（必須）

```bash
npm run format
```

- Prettierによるコードフォーマットの統一
- コードスタイルの一貫性を保証

#### 2. Linter実行

```bash
npm run lint
```

- ESLintによるコード品質チェック
- エラーがある場合は修正する

#### 3. 型チェック

```bash
npx tsc --noEmit
```

- TypeScriptの型エラーチェック
- 型エラーがある場合は修正する

#### 4. テスト実行

```bash
npm test
```

- 全テストケースの実行
- テストが失敗する場合は修正する

#### 5. ビルド確認

```bash
npm run build
```

- プロダクションビルドの成功確認
- ビルドエラーがある場合は修正する

#### 5. formatter

```bash
npm run format
```

### コードフォーマット

- **Prettier設定**: `.prettierrc`に基づいてフォーマット
- **フォーマット確認**: `npm run format:check`でフォーマット済みかチェック
- **自動修正**: `npm run format`で自動フォーマット適用
- **設定方針**: セミコロンあり、シングルクォート、改行文字LF、タブ幅2スペース

### テストケース作成指針

- 新しい機能を実装する際は、対応するテストケースを必ず作成する
- 以下のテストパターンを網羅する：
  - 正常系のテスト
  - 異常系のテスト（エラーハンドリング）
  - 境界値テスト
  - エッジケーステスト
- テストカバレッジは80%以上を目指す

### コード品質基準

- TypeScriptの厳密な型定義を使用する
- ESLintルールに準拠する
- 関数とクラスには適切なJSDocコメントを記載する
- エラーハンドリングを適切に実装する
- Prettierによる統一されたコードフォーマットを維持する

## フォーマット設定詳細

### Prettier設定 (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "quoteProps": "as-needed",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "embeddedLanguageFormatting": "auto"
}
```

### フォーマット対象ファイル

- TypeScript/JavaScript (.ts, .tsx, .js, .jsx)
- JSON (.json)
- Markdown (.md)
- CSS/SCSS (.css, .scss)
- HTML (.html)

### フォーマット除外ファイル

- ビルド出力 (.next/, dist/, build/)
- 依存関係 (node_modules/)
- 環境ファイル (.env*)
- ログファイル (*.log)
- 生成ファイル (*.generated.*)
