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
  assert.equal(store.list().length, 2);
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

  assert.throws(() => store.markDone(999), /Task 999 was not found/);
});

test('formatTask shows open and completed states', () => {
  assert.equal(formatTask({ id: 1, title: 'Open task', done: false }), '1. [ ] Open task');
  assert.equal(formatTask({ id: 2, title: 'Done task', done: true }), '2. [x] Done task');
});

test('parseId accepts positive numeric ids only', () => {
  assert.equal(parseId('42'), 42);
  assert.throws(() => parseId('0'), /positive numeric/);
  assert.throws(() => parseId('abc'), /positive numeric/);
});

test('runCli adds and lists tasks', () => {
  const store = new TaskStore(tempTaskFile());

  const added = runCli(['node', 'task-cli.js', 'add', 'Write', 'tests'], { store });
  const listed = runCli(['node', 'task-cli.js', 'list'], { store });

  assert.equal(added, 'Added task 1: Write tests');
  assert.equal(listed, '1. [ ] Write tests');
});

test('runCli filters listed tasks by open status', () => {
  const store = new TaskStore(tempTaskFile());
  store.add('Write tests');
  store.add('Review diff');
  store.markDone(2);

  const listed = runCli(['node', 'task-cli.js', 'list', '--status', 'open'], { store });

  assert.equal(listed, '1. [ ] Write tests');
});

test('runCli filters listed tasks by done status', () => {
  const store = new TaskStore(tempTaskFile());
  store.add('Write tests');
  store.add('Review diff');
  store.markDone(2);

  const listed = runCli(['node', 'task-cli.js', 'list', '--status', 'done'], { store });

  assert.equal(listed, '2. [x] Review diff');
});

test('runCli rejects unknown list status filters', () => {
  const store = new TaskStore(tempTaskFile());

  assert.throws(
    () => runCli(['node', 'task-cli.js', 'list', '--status', 'later'], { store }),
    /--status open or --status done/
  );
});

test('runCli marks tasks as done', () => {
  const store = new TaskStore(tempTaskFile());
  store.add('Review diff');

  const completed = runCli(['node', 'task-cli.js', 'done', '1'], { store });
  const listed = runCli(['node', 'task-cli.js', 'list'], { store });

  assert.equal(completed, 'Completed task 1: Review diff');
  assert.equal(listed, '1. [x] Review diff');
});

test('runCli prints help for missing command', () => {
  const output = runCli(['node', 'task-cli.js']);

  assert.match(output, /Usage:/);
  assert.match(output, /add <title>/);
});
