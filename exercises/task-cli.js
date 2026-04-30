#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_FILE = path.join(process.cwd(), '.tasks.json');
const DEFAULT_PRIORITY = 'medium';
const VALID_PRIORITIES = ['low', 'medium', 'high'];

class TaskStore {
  constructor(filePath = DEFAULT_FILE) {
    this.filePath = filePath;
  }

  load() {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }

    const raw = fs.readFileSync(this.filePath, 'utf8');
    if (raw.trim() === '') {
      return [];
    }

    return JSON.parse(raw);
  }

  save(tasks) {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, `${JSON.stringify(tasks, null, 2)}\n`);
  }

  add(title, priority = DEFAULT_PRIORITY) {
    const tasks = this.load();
    const taskPriority = parsePriority(priority);
    const nextId = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    const task = {
      id: nextId,
      title,
      priority: taskPriority,
      done: false,
      createdAt: new Date().toISOString()
    };

    tasks.push(task);
    this.save(tasks);
    return task;
  }

  markDone(id) {
    const tasks = this.load();
    const task = tasks.find((item) => item.id === id);

    if (!task) {
      throw new Error(`タスク ${id} が見つかりません。`);
    }

    task.done = true;
    task.completedAt = new Date().toISOString();
    this.save(tasks);
    return task;
  }

  list() {
    return this.load();
  }
}

function formatTask(task) {
  const status = task.done ? 'x' : ' ';
  const priority = task.priority || DEFAULT_PRIORITY;
  return `${task.id}. [${status}] [${priority}] ${task.title}`;
}

function printHelp() {
  return [
    '使い方:',
    '  node exercises/task-cli.js add <title> [--priority low|medium|high]',
    '  node exercises/task-cli.js list [--status open|done]',
    '  node exercises/task-cli.js done <id>',
    '',
    '例:',
    '  node exercises/task-cli.js add "Read TUTORIAL.md"',
    '  node exercises/task-cli.js done 1'
  ].join('\n');
}

function parseId(value) {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('正の数値のタスク ID を指定してください。');
  }
  return id;
}

function parsePriority(value) {
  if (!VALID_PRIORITIES.includes(value)) {
    throw new Error('--priority には low、medium、high のいずれかを指定してください。');
  }

  return value;
}

function parseAddArgs(args) {
  const priorityIndex = args.indexOf('--priority');
  let priority = DEFAULT_PRIORITY;
  const titleParts = [...args];

  if (priorityIndex !== -1) {
    priority = parsePriority(args[priorityIndex + 1]);
    titleParts.splice(priorityIndex, 2);
  }

  return {
    title: titleParts.join(' ').trim(),
    priority
  };
}

function parseStatusFilter(args) {
  const statusIndex = args.indexOf('--status');
  if (statusIndex === -1) {
    return null;
  }

  const status = args[statusIndex + 1];
  if (status !== 'open' && status !== 'done') {
    throw new Error('--status には open または done を指定してください。');
  }

  return status;
}

function filterTasksByStatus(tasks, status) {
  if (status === 'open') {
    return tasks.filter((task) => !task.done);
  }

  if (status === 'done') {
    return tasks.filter((task) => task.done);
  }

  return tasks;
}

function runCli(argv, options = {}) {
  const store = options.store || new TaskStore(options.filePath);
  const command = argv[2];
  const output = [];

  if (!command || command === 'help' || command === '--help') {
    output.push(printHelp());
    return output.join('\n');
  }

  if (command === 'add') {
    const { title, priority } = parseAddArgs(argv.slice(3));
    if (!title) {
      throw new Error('タスクのタイトルを指定してください。');
    }
    const task = store.add(title, priority);
    output.push(`タスク ${task.id} を追加しました: ${task.title}`);
    return output.join('\n');
  }

  if (command === 'list') {
    const status = parseStatusFilter(argv.slice(3));
    const tasks = filterTasksByStatus(store.list(), status);
    if (tasks.length === 0) {
      output.push('No tasks yet.');
    } else {
      output.push(...tasks.map(formatTask));
    }
    return output.join('\n');
  }

  if (command === 'done') {
    const id = parseId(argv[3]);
    const task = store.markDone(id);
    output.push(`タスク ${task.id} を完了しました: ${task.title}`);
    return output.join('\n');
  }

  throw new Error(`不明なコマンドです: ${command}`);
}

if (require.main === module) {
  try {
    console.log(runCli(process.argv));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_PRIORITY,
  TaskStore,
  filterTasksByStatus,
  formatTask,
  parseAddArgs,
  parseId,
  parsePriority,
  parseStatusFilter,
  printHelp,
  runCli
};
