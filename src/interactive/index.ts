import { File, TaskState, type Task } from "../lib";
import SelectMode from "./selectMode";
import readline from 'readline';

const C = {
    reset: '\x1B[0m',
    bold: '\x1B[1m',
    cyanBg: '\x1B[46m',
    whiteBg: '\x1B[47m',
    black: '\x1B[30m',
    white: '\x1B[37m',
    dim: '\x1B[2m',
    hideCursor: '\x1B[?25l',
    showCursor: '\x1B[?25h',
    clear: '\x1B[2J\x1B[H',
};

enum Mode {
    Select = 0,
    Edit
}

export enum ActionType {
    NoOp,
    Exit,
    Up,
    Down,
    MoveUp,
    MoveDown,
    ToggleState,
    InlineEdit,
    InlineEditCancel,
    InlineEditNewline,
    NewTask,
}

export interface Action
// Simple Actions
{
    action: 
        ActionType.NoOp |
        ActionType.Exit |
        ActionType.Up |
        ActionType.Down |
        ActionType.MoveUp |
        ActionType.MoveDown |
        ActionType.ToggleState |
        ActionType.InlineEditCancel |
        ActionType.NewTask |
        ActionType.InlineEdit;
}

export interface InteractiveMode {
    render: (tasks: Task[], selected: number) => void;
    getStatus: () => string;
    onKeypress: (e: KeyEvent) => Action;
};

export interface KeyEvent {
    str: string,
    key: {
        name: string,
        shift: boolean,
        ctrl:  boolean,
        meta:  boolean,
    }
}

const tasks: Task[] = [];
let selected: number = -1;
let currentMode: Mode = Mode.Select;
let file: string;
const modes = [
    SelectMode
];

async function start(filepath: string) {
    file = filepath;
    tasks.push(...await File.read(file));
    if(tasks.length > 0) selected = 0;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        escapeCodeTimeout: 50
    });
    readline.emitKeypressEvents(process.stdin, rl);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
        const a = modes[currentMode]!.onKeypress({
            str,
            key: {
                name:  key.name,
                shift: key.shift,
                ctrl:  key.ctrl,
                meta:  key.meta,
            }
        });
        doAction(a);
        render();
    });

    const onExit = () => doAction({ action: ActionType.Exit })

    process.on('exit', onExit);
    process.on('SIGINT', onExit);
    process.on('SIGTERM', onExit);
}

const render = () => {
    const m = modes[currentMode]!;
    console.clear();
    m.render(tasks, selected);
    console.log('');
    console.log(m.getStatus());
    process.stdout.write(C.hideCursor);
};

// TODO: accept arrays for action chains (new task -> edit)
function doAction(a: Action) {
    switch(a.action) {
        case ActionType.Exit: {
            File.write(file, tasks);
            exitProcess();
            return;
        }
        case ActionType.Up: {
            if(tasks.length == 0) return;
            selected = Math.max(0, selected - 1);
            return;
        }
        case ActionType.Down: {
            if(tasks.length == 0) return;
            selected = Math.min(tasks.length - 1, selected + 1);
            return;
        }
        case ActionType.MoveUp: {
            if (selected == 0) {
                tasks[selected]!.state = TaskState.Default;
                return;
            }
            const tmp = tasks[selected - 1]!;
            if(tasks[selected]!.state != tmp.state) {
                tasks[selected]!.state = tmp.state;
                return;
            }
            tasks[selected - 1] = tasks[selected]!;
            tasks[selected] = tmp;
            selected = selected - 1;
            return;
        }
        case ActionType.MoveDown: {
            if (selected == tasks.length - 1) {
                tasks[selected]!.state = TaskState.Completed;
                return;
            }
            const tmp = tasks[selected + 1]!;
            if(tasks[selected]!.state != tmp.state) {
                tasks[selected]!.state = tmp.state;
                return;
            }
            tasks[selected]!.state = tmp.state;
            tasks[selected + 1] = tasks[selected]!;
            tasks[selected] = tmp;
            selected = selected + 1;
            return;
        }
        case ActionType.NewTask: {
            // TODO: Make Task constructor
            const newTask: Task = {
                id: "",
                state: TaskState.Default,
                weight: 0,
                text: ""
            };

            if(tasks.length == 0) {
                tasks.push(newTask);
                selected = 0;
                return;
            }
            tasks.splice(selected, 0, newTask);
            selected++;
            return;
        }
        case ActionType.ToggleState:
        case ActionType.InlineEdit:
        case ActionType.InlineEditCancel:
            // TODO: implement
        case ActionType.NoOp:
        default:
            return;
    }
}

export default {
    start,
}

function exitProcess() {
    console.clear();
    process.stdout.write(C.showCursor);
    process.exit(0);
}