#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_FILE = path.join(process.cwd(), '.tasks.json');

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

  add(title) {
    const tasks = this.load();
    const nextId = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    const task = {
      id: nextId,
      title,
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
      throw new Error(`Task ${id} was not found.`);
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
  return `${task.id}. [${status}] ${task.title}`;
}

function printHelp() {
  return [
    'Usage:',
    '  node exercises/task-cli.js add <title>',
    '  node exercises/task-cli.js list',
    '  node exercises/task-cli.js done <id>',
    '',
    'Examples:',
    '  node exercises/task-cli.js add "Read TUTORIAL.md"',
    '  node exercises/task-cli.js done 1'
  ].join('\n');
}

function parseId(value) {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Please provide a positive numeric task id.');
  }
  return id;
}

function parseStatusFilter(args) {
  const statusIndex = args.indexOf('--status');
  if (statusIndex === -1) {
    return null;
  }

  const status = args[statusIndex + 1];
  if (status !== 'open' && status !== 'done') {
    throw new Error('Please provide --status open or --status done.');
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
    const title = argv.slice(3).join(' ').trim();
    if (!title) {
      throw new Error('Please provide a task title.');
    }
    const task = store.add(title);
    output.push(`Added task ${task.id}: ${task.title}`);
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
    output.push(`Completed task ${task.id}: ${task.title}`);
    return output.join('\n');
  }

  throw new Error(`Unknown command: ${command}`);
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
  TaskStore,
  filterTasksByStatus,
  formatTask,
  parseId,
  parseStatusFilter,
  printHelp,
  runCli
};
