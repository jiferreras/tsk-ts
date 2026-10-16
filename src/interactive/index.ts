import { File, sortTasks, Task, TaskState } from "../lib";
import SelectMode from "./selectMode";
import EditMode, { setState } from "./editMode";
import readline from 'readline';

export const EscapeC = {
    reset: '\x1B[0m',
    bold: '\x1B[1m',
    cyanBg: '\x1B[46m',
    whiteBg: '\x1B[47m',
    black: '\x1B[30m',
    white: '\x1B[37m',
    green: '\x1B[32m',
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
    Edit,
    EditExit,
    EditNewline,
    EditMergePrev,
    EditCursorUp,
    EditCursorDown,
    NewTask,
    DeleteTask,
}

export type Action = {
    action: 
        ActionType.NoOp |
        ActionType.Exit |
        ActionType.Up |
        ActionType.Down |
        ActionType.MoveUp |
        ActionType.MoveDown |
        ActionType.ToggleState |
        ActionType.Edit;
} | {
    action:
        ActionType.NewTask |
        ActionType.EditExit |
        ActionType.EditMergePrev |
        ActionType.EditCursorUp |
        ActionType.EditCursorDown;
    text: string;
} | {
    action: ActionType.EditNewline,
    lhs: string,
    rhs: string
} | {
    action: ActionType.DeleteTask,
    moveCursor: boolean
};


export interface InteractiveMode {
    render: (tasks: Task[], selected: number) => void;
    getStatus: (hasTasks: boolean) => string;
    onKeypress: (e: KeyEvent) => Action | Action[];
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

let tasks: Task[] = [];
let selected: number = -1;
let currentMode: Mode = Mode.Select;
let file: string;
const modes = [
    SelectMode,
    EditMode
];
const debug: string[] = []

async function start(filepath: string) {
    file = filepath;
    // TODO: Prompt user on missing file
    tasks.push(...await File.read(file));
    if(tasks.length > 0) selected = 0;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        escapeCodeTimeout: 50
    });

    readline.emitKeypressEvents(process.stdin, rl);
    if (process.stdin.isTTY)
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
    
    render();
}

export function getRemainingCount(): number {
    if(tasks.length == 0) return -1;
    return tasks.findLastIndex(t => t.state == TaskState.Default) + 1;
}

export default {
    start,
}

const render = () => {
    const m = modes[currentMode]!;
    console.clear();
    m.render(tasks, selected);
    console.log('');
    console.log(m.getStatus(tasks.length > 0));
    process.stdout.write(EscapeC.hideCursor);
    // debug.slice(-5).forEach(s => console.log(s));
};

function doAction(a: Action | Action[]) {
    if(Array.isArray(a)) {
        a.forEach(e => doAction(e));
        return;
    }
    if(a.action != ActionType.NoOp) {
        const line = `[${ActionType[a.action]}]: ${JSON.stringify({
            ...a,
            action: undefined
        })}`;
        debug.push(line);
    }
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
            const newTask: Task = new Task({
                weight: (() => {
                    const t = tasks[selected];
                    return t ? t.weight : 0;
                })()
            });

            if(tasks.length == 0) {
                tasks.push(newTask);
                selected = 0;
                return;
            }
            tasks.splice(selected + 1, 0, newTask);
            doAction({ action: ActionType.Down });
            return;
        }
        case ActionType.DeleteTask: {
            tasks.splice(selected, 1);
            if(a.moveCursor) doAction({ action: ActionType.Up });
            currentMode = Mode.Select;
            break;
        }
        case ActionType.ToggleState: {
            const t = tasks[selected]!;
            if(t.state == TaskState.Note) break;
            const id = t.id;
            t.state = (
                t.state == TaskState.Default ?
                TaskState.Completed :
                TaskState.Default
            );
            tasks = sortTasks(tasks);
            selected = tasks.findIndex(tt => tt.id == id);
            break;
        }
        case ActionType.Edit: {
            if(tasks.length == 0) {
                doAction([
                    { action: ActionType.NewTask, text: "" },
                    { action: ActionType.Edit }
                ]);
                return;
            }
            currentMode = Mode.Edit;
            const t = tasks[selected]!;
            setState(t.text);
            break;
        }
        case ActionType.EditExit: {
            currentMode = Mode.Select;
            if(a.text == "") {
                tasks.splice(selected, 1);
                doAction({ action: ActionType.Up });
                return;
            }
            const t = tasks[selected]!;
            t.text = a.text;
            break;
        }
        case ActionType.EditNewline: {
            tasks[selected]!.text = a.lhs;
            tasks.splice(selected + 1, 0, new Task({
                text: a.rhs,
            }))
            doAction({ action: ActionType.Down });
            setState(a.rhs, 0);
            break;
        }
        case ActionType.EditMergePrev: {
            if(selected == 0) return;
            tasks.splice(selected, 1);
            doAction({ action: ActionType.Up });
            const t = tasks[selected]!;
            setState(
                t.text + a.text,
                t.text.length
            );
            break;
        }
        case ActionType.EditCursorUp: {
            if(tasks.length == 0) return;
            tasks[selected]!.text = a.text;
            selected = Math.max(0, selected - 1);
            setState(tasks[selected]!.text, -1);
            return;
        }
        case ActionType.EditCursorDown: {
            if(tasks.length == 0) return;
            tasks[selected]!.text = a.text;
            selected = Math.min(tasks.length - 1, selected + 1);
            setState(tasks[selected]!.text, -1);
            return;
        }
        case ActionType.NoOp:
        default:
            return;
    }
}

function exitProcess() {
    console.clear();
    process.stdout.write(EscapeC.showCursor);
    process.exit(0);
}