const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  TaskStore,
  formatTask,
  parseId,
  runCli
} = require('../exercises/task-cli');

function tempTaskFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-tutorial-'));
  return path.join(dir, 'tasks.json');
}

test('TaskStore starts with an empty task list', () => {
  const store = new TaskStore(tempTaskFile());

  assert.deepEqual(store.list(), []);
});

test('TaskStore adds tasks with incrementing ids', () => {
  const store = new TaskStore(tempTaskFile());

  const first = store.add('Read tutorial');
  const second = store.add('Run tests');

  assert.equal(first.id, 1);
  assert.equal(second.id, 2);
  assert.equal(first.priority, 'medium');
  assert.equal(store.list().length, 2);
});

test('TaskStore adds tasks with custom priority', () => {
  const store = new TaskStore(tempTaskFile());

  const task = store.add('Fix bug', 'high');

  assert.equal(task.priority, 'high');
});

test('TaskStore rejects unknown priority values', () => {
  const store = new TaskStore(tempTaskFile());

  assert.throws(() => store.add('Fix bug', 'urgent'), /--priority には low、medium、high/);
});

test('TaskStore marks a task as done', () => {
  const store = new TaskStore(tempTaskFile());
  const task = store.add('Finish step 1');

  const completed = store.markDone(task.id);

  assert.equal(completed.done, true);
  assert.match(completed.completedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('TaskStore throws when the task does not exist', () => {
  const store = new TaskStore(tempTaskFile());

  assert.throws(() => store.markDone(999), /タスク 999 が見つかりません/);
});

test('formatTask shows open and completed states with priority', () => {
  assert.equal(formatTask({ id: 1, title: 'Open task', priority: 'low', done: false }), '1. [ ] [low] Open task');
  assert.equal(formatTask({ id: 2, title: 'Done task', priority: 'high', done: true }), '2. [x] [high] Done task');
  assert.equal(formatTask({ id: 3, title: 'Old task', done: false }), '3. [ ] [medium] Old task');
});

test('parseId accepts positive numeric ids only', () => {
  assert.equal(parseId('42'), 42);
  assert.throws(() => parseId('0'), /正の数値/);
  assert.throws(() => parseId('abc'), /正の数値/);
});

test('runCli adds and lists tasks', () => {
  const store = new TaskStore(tempTaskFile());

  const added = runCli(['node', 'task-cli.js', 'add', 'Write', 'tests'], { store });
  const listed = runCli(['node', 'task-cli.js', 'list'], { store });

  assert.equal(added, 'タスク 1 を追加しました: Write tests');
  assert.equal(listed, '1. [ ] [medium] Write tests');
});

test('runCli adds tasks with priority', () => {
  const store = new TaskStore(tempTaskFile());

  const added = runCli(['node', 'task-cli.js', 'add', 'Fix', 'bug', '--priority', 'high'], { store });
  const listed = runCli(['node', 'task-cli.js', 'list'], { store });

  assert.equal(added, 'タスク 1 を追加しました: Fix bug');
  assert.equal(listed, '1. [ ] [high] Fix bug');
});

test('runCli rejects unknown priority values', () => {
  const store = new TaskStore(tempTaskFile());

  assert.throws(
    () => runCli(['node', 'task-cli.js', 'add', 'Fix', 'bug', '--priority', 'urgent'], { store }),
    /--priority には low、medium、high/
  );
});

test('runCli filters listed tasks by open status', () => {
  const store = new TaskStore(tempTaskFile());
  store.add('Write tests');
  store.add('Review diff');
  store.markDone(2);

  const listed = runCli(['node', 'task-cli.js', 'list', '--status', 'open'], { store });

  assert.equal(listed, '1. [ ] [medium] Write tests');
});

test('runCli filters listed tasks by done status', () => {
  const store = new TaskStore(tempTaskFile());
  store.add('Write tests');
  store.add('Review diff');
  store.markDone(2);

  const listed = runCli(['node', 'task-cli.js', 'list', '--status', 'done'], { store });

  assert.equal(listed, '2. [x] [medium] Review diff');
});

test('runCli rejects unknown list status filters', () => {
  const store = new TaskStore(tempTaskFile());

  assert.throws(
    () => runCli(['node', 'task-cli.js', 'list', '--status', 'later'], { store }),
    /--status には open または done/
  );
});

test('runCli marks tasks as done', () => {
  const store = new TaskStore(tempTaskFile());
  store.add('Review diff');

  const completed = runCli(['node', 'task-cli.js', 'done', '1'], { store });
  const listed = runCli(['node', 'task-cli.js', 'list'], { store });

  assert.equal(completed, 'タスク 1 を完了しました: Review diff');
  assert.equal(listed, '1. [x] [medium] Review diff');
});

test('runCli prints help for missing command', () => {
  const output = runCli(['node', 'task-cli.js']);

  assert.match(output, /使い方:/);
  assert.match(output, /add <title>/);
});
