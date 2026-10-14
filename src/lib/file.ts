import { open, writeFile } from 'node:fs/promises'
import { sortTasks, Task, TaskState } from ".";
import type { FileHandle } from 'node:fs/promises';

const SEP_CHAR = '|';
const PROPS_STR = [ 'id', 'state', 'weight', 'text' ];
const STATES_STR = [' ', 'x', 'n']

enum TaskProp {
    Id = 0,
    State,
    Weight,
    Text
};

type TskFileHeader = (TaskProp | null)[];

async function read(path: string) {
    let file: FileHandle;
    let header: TskFileHeader | undefined = undefined;
    const tasks: Task[] = [];
    
    try { file = await open(path); }
    catch (err) {
        console.log(`Couldn't load file ${path}: ${err}`);
        return tasks;
    }

    for await (const line of file.readLines()) {
        if(!header) {
            header = processHeader(line);
            continue;
        }
        const t = processRow(line, header);
        if(!t) {
            console.log(`${path}: Couldn't process row:\n${line}`);
            continue;
        }
        tasks.push(t);
    }

    return tasks;
}

async function write(path: string, tasks: Task[]) {
    const s = toFileStr(tasks);

    try { await writeFile(path, s); }
    catch (err) {
        console.log(`Couldn't save file ${path}: ${err}`)
    }
}

export default {
    SEP_CHAR,
    STATES_STR,
    read,
    write,
}

function toFileStr(tArr: Task[]): string {
    const header = PROPS_STR.join(SEP_CHAR);
    const tasks = sortTasks(tArr).map(t => taskToString(t));

    return [header, ...tasks].join('\n');
}

function taskToString(t: Task): string {
    return PROPS_STR
        .map(p => propToString(t, p))
        .join(SEP_CHAR);
}

function stringToProp(s: string): TaskProp | null {
    const i = PROPS_STR.indexOf(s);

    return i >= 0 ? i : null;
}

function propToString(t: Task, s: string): string {
    switch(s) {
        case 'id':
            return t.id;
        case 'state':
            return STATES_STR[t.state]!;
        case 'weight':
            return ('!').repeat(t.weight);
        case 'text':
            return t.text;
        default:
            return "";
    }
}

function stringToState(s: string): TaskState {
    const i = STATES_STR.indexOf(s);

    return i >= 0 ? i : TaskState.Default;
}

function applyProp(t:Task, s:string, p:TaskProp | null): void {
    switch(p) {
        case TaskProp.Id:
            t.id = s;
            break;
        case TaskProp.State:
            t.state = stringToState(s);
            break;
        case TaskProp.Weight:
            t.weight = s.length;
            break;
        case TaskProp.Text:
            t.text = s;
            break;
    }
}

function processHeader(s: string): TskFileHeader {
    const cols = s.split(SEP_CHAR);
    const h: TskFileHeader = [];

    cols.forEach(p => h.push(stringToProp(p)));

    return h;
}

function processRow(s: string, h: TskFileHeader): Task | undefined {
    const t = new Task();
    const vals = s.split(SEP_CHAR);

    if(h.length != vals.length) {
        console.log("WARNING: couldn't process row", s);
        return undefined;
    }
    
    h.forEach((col, i) => {
        applyProp(t, vals[i]!, col)
    });

    return t;
}