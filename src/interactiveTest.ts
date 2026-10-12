import chalk from 'chalk';
import readline from 'readline';

enum Mode {
    Select = 0,
    Move,
    Edit
}

const tasks = [
    { id: '1', title: 'Fix login', status: ' ' },
    { id: '2', title: 'Update docs', status: '-' },
    { id: '3', title: 'Refactor auth', status: 'x' },
];

let selected = 0;
let editBuffer = '';
let mode: Mode = Mode.Select;

const render = () => {
    console.clear();
    console.log('\nTasks:');
    switch (mode) {
        case Mode.Select:
            tasks.forEach((t, i) => {
                const line = `[${t.status}] ${t.title}`;
                console.log(
                    (i === selected ? '▶ ' : '  ')
                    + line
                );
            });
            console.log('');
            console.log(chalk.bgCyan.black.bold('SELECT ↑↓=Cursor m=Move Enter=Select q=Quit'));
            break;
        case Mode.Move:
            tasks.forEach((t, i) => {
                const line = `[${t.status}] ${t.title}`;
                console.log(
                    i === selected ?
                        chalk.bgCyan.black('▶ ' + line) :
                        '  ' + line
                );
            });
            console.log('');
            console.log(chalk.bgCyan.black.bold('MOVE ↑↓=Move Enter=Confirm'));
            break;
        case Mode.Edit:
            tasks.forEach((t, i) => {
                const line = `[${t.status}] ${i === selected ? editBuffer + '_' : t.title}`;
                console.log(
                    (i === selected ? '▶ ' : '  ')
                    + line
                );
            });
            console.log('');
            console.log(chalk.bgCyan.black.bold('EDIT Enter=Confirm Escape=Cancel'));
            break;
    }
    process.stdout.write('\x1B[?25l');
};

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
    switch (mode) {
        case Mode.Select:
            if (key.name === 'up') selected = Math.max(0, selected - 1);
            if (key.name === 'down') selected = Math.min(tasks.length - 1, selected + 1);
            if (key.name === 'return') {
                editBuffer = tasks[selected]!.title;
                mode = Mode.Edit;
            }
            if (key.name === 'm') {
                mode = Mode.Move;
            }
            if (key.name === 'q') {
                console.clear();
                process.exit(0);
            }
            break;
        case Mode.Move:
            if (key.name === 'up') {
                if (selected == 0) break;
                const tmp = tasks[selected - 1]!;
                tasks[selected]!.status = tmp.status;
                tasks[selected - 1] = tasks[selected]!;
                tasks[selected] = tmp;
                selected = selected - 1;
            }
            if (key.name === 'down') {
                if (selected == tasks.length - 1) break;
                const tmp = tasks[selected + 1]!;
                tasks[selected]!.status = tmp.status;
                tasks[selected + 1] = tasks[selected]!;
                tasks[selected] = tmp;
                selected = selected + 1;
            }
            if (key.name === 'return' || key.name === 'm') {
                mode = Mode.Select;
            }
            if (key.name === 'q') {
                console.clear();
                process.exit(0);
            }
            break;
        case Mode.Edit:
            if (key.name === 'return') {
                if (editBuffer === '') {
                    tasks.splice(selected, 1);
                    selected = Math.max(0, selected - 1);
                    mode = Mode.Select;
                    break;
                }
                tasks[selected]!.title = editBuffer;
                tasks.splice(selected + 1, 0, {
                    ...tasks[selected]!,
                    title: ''
                });
                editBuffer = '';
                selected++;
            } else if (key.name === 'escape') {
                mode = Mode.Select;
            } else if (key.name === 'backspace') {
                if (editBuffer === '') {
                    tasks.splice(selected, 1);
                    if (selected === 0) {
                        mode = Mode.Select;
                        break;
                    }
                    selected = Math.max(0, selected - 1);
                    editBuffer = tasks[selected]!.title;
                    break;
                }
                editBuffer = editBuffer.slice(0, -1);
            } else if (!key.ctrl && !key.meta && str) {
                editBuffer += str;
            }
            break;
    }
    render();
});

process.on('exit', () => {
    process.stdout.write('\x1B[?25h');
});
process.on('SIGINT', () => {
    process.stdout.write('\x1B[?25h');
    process.exit(0);
});
process.on('SIGTERM', () => {
    process.stdout.write('\x1B[?25h');
    process.exit(0);
});

render();