import chalk from 'chalk';
import readline from 'readline';
import LineEdit from './lineEditTest';

enum Mode {
    Select = 0,
    Edit
}

interface Task {
    id: string;
    title: string;
    status: string;
}

interface InteractiveMode {
    renderTasks: (t: Task, selected: boolean) => void;
    renderStatus: () => void;
    onKeypress: (str: string, key: any) => void;
};

const tasks: Task[] = [
    { id: '1', title: 'Fix login', status: ' ' },
    { id: '2', title: 'Update docs', status: ' ' },
    { id: '3', title: 'Refactor auth', status: 'x' },
];

let selected = 0;
let currentMode: Mode = Mode.Select;
const modes: InteractiveMode[] = [];

modes[Mode.Select] = {
    renderTasks: (t, selected) => {
        const line = `[${t.status}] ${t.title}`;
        if(t.status == ' ')
            console.log(
                (selected ? '▶ ' : '  ') + line
            );
        else {
            console.log(
                chalk.gray((selected ? '▶ ' : '  ') + line)
            );
        }
    },
    renderStatus: () => {
        console.log(
            chalk.bgCyan.black.bold('SELECT ↑↓=Cursor Shift+↑↓=Move Enter=Edit q=Quit')
        );
    },
    onKeypress: (_, key: any) => {
        if (key.name === 'up') {
            if (key.shift) {
                if (selected == 0) {
                    tasks[selected]!.status = ' ';
                    return;
                }
                const tmp = tasks[selected - 1]!;
                if(tasks[selected]!.status != tmp.status) {
                    tasks[selected]!.status = tmp.status;
                    return;
                }
                tasks[selected - 1] = tasks[selected]!;
                tasks[selected] = tmp;
                selected = selected - 1;
                return;
            }
            selected = Math.max(0, selected - 1);
        }
        if (key.name === 'down') {
            if (key.shift) {
                if (selected == tasks.length - 1) {
                    tasks[selected]!.status = 'x';
                    return;
                }
                const tmp = tasks[selected + 1]!;
                if(tasks[selected]!.status != tmp.status) {
                    tasks[selected]!.status = tmp.status;
                    return;
                }
                tasks[selected]!.status = tmp.status;
                tasks[selected + 1] = tasks[selected]!;
                tasks[selected] = tmp;
                selected = selected + 1;
                return;
            }
            selected = Math.min(tasks.length - 1, selected + 1);
        }
        if (key.name === 'return') {
            LineEdit.init(tasks[selected]!.title, (result: string) => {
                tasks[selected]!.title = result;
                currentMode = Mode.Select;
            });
            currentMode = Mode.Edit;
        }
        if (key.name === 'q') {
            console.clear();
            process.exit(0);
        }
    }
};

modes[Mode.Edit] = {
    renderTasks: (t, selected) => {
        const line = `[${t.status}] ${selected ? LineEdit.getState() : t.title}`;
        console.log(
            selected ? '▶ ' + line : chalk.gray('  ' + line)
        );
    },
    renderStatus: LineEdit.renderStatus,
    onKeypress: LineEdit.onKeypress
};

const render = () => {
    const m = modes[currentMode]!;
    console.clear();
    let completed = false;
    for(let i = 0; i < tasks.length; i++) {
        const t = tasks[i]!;
        if(i == 0 && t.status == ' ')
            console.log("Tasks:");
        else if(!completed && t.status == 'x') {
            console.log(chalk.grey("Completed:"))
            completed = true;
        }
        modes[currentMode]?.renderTasks(t, selected == i);
    }
    console.log('');
    m.renderStatus();
    process.stdout.write('\x1B[?25l');
};


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    escapeCodeTimeout: 50
});

readline.emitKeypressEvents(process.stdin, rl);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
    modes[currentMode]!.onKeypress(str, key);
    render();
});

function exitProcess() {
    process.stdout.write('\x1B[?25h');
    process.exit(0);
}

process.on('exit', exitProcess);
process.on('SIGINT', exitProcess);
process.on('SIGTERM', exitProcess);

render();