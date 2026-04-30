# Codex Tutorial

Codex の主要機能を step by step で学ぶための小さなチュートリアル・プロジェクトです。

題材は依存パッケージなしで動くタスク管理 CLI です。Codex にコードを読ませ、機能追加を依頼し、テストを走らせ、レビューしてもらうところまで一通り体験できます。

## はじめ方

```bash
cd ~/projects/codex-tutorial
node --version
npm test
```

Node.js 18 以上を推奨します。

## ファイル構成

```text
codex-tutorial/
├── AGENTS.md               # Codex へのプロジェクト固有ルール
├── TUTORIAL.md             # Step by step ガイド
├── TODO.md                 # 練習用の小さな改善タスク
├── package.json
├── docs/
│   └── prompts.md          # そのまま使えるプロンプト集
├── exercises/
│   └── task-cli.js         # 学習用の小さな CLI アプリ
└── tests/
    └── task-cli.test.js    # Node 標準 test runner のテスト
```

## まず試すコマンド

```bash
npm test
node exercises/task-cli.js add "Codex tutorial を始める"
node exercises/task-cli.js list
node exercises/task-cli.js done 1
node exercises/task-cli.js list
```

CLI はローカルに `.tasks.json` を作ります。練習中のデータなので、不要になったら削除して構いません。

## 学習の進め方

1. [TUTORIAL.md](TUTORIAL.md) を上から順番に進める
2. 途中のプロンプトを Codex に投げる
3. Codex が変更したら `npm test` で確認する
4. `git diff` を見ながら、何が変わったか説明してもらう

