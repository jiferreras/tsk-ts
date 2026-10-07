const SEP_CHAR = '|';

const PROPS_STR = [ 'id', 'state', 'weight', 'text' ];

enum TaskProp {
    Id = 0,
    State,
    Weight,
    Text
};

const STATES_STR = ['', 'x', 't', 's']

enum TaskState {
    Default = 0,
    Completed,
    Template,
    Scheduled,
}

function sortTasks(tArr: Task[]) {
    return tArr
        .sort((a, b) => b.weight - a.weight)
        .sort((a, b) => a.state  - b.state )
    ;
}

function toFile(tArr: Task[]): string {
    const header = PROPS_STR.join(SEP_CHAR);
    const tasks = sortTasks(tArr).map(t => t.toString());

    return [header, ...tasks].join('\n');
}

function stringToProp(s: string): TaskProp | null {
    const i = PROPS_STR.indexOf(s);

    return i >= 0 ? i : null;
}

function stringToState(s: string): TaskState {
    const i = STATES_STR.indexOf(s);

    return i >= 0 ? i : TaskState.Default;
}

type TskFileHeader = (TaskProp | null)[];

function processHeader(s: string): TskFileHeader {
    const cols = s.split(SEP_CHAR);
    const h: TskFileHeader = [];

    cols.forEach(p => h.push(stringToProp(p)));

    return h;
}

function applyProp(t:Task, s:string, p:TaskProp | null) {
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

class Task {
    id: string = "";
    state: TaskState = TaskState.Default;
    weight: number = 0;
    text: string = "";

    toString(): string {
        return [
            this.id,                    // id
            STATES_STR[this.state]!,    // state
            ('!').repeat(this.weight),  // weight
            this.text                   // text
        ].join(SEP_CHAR);
    }
}

const dummyCSV = [
    'id|state|weight|text',
    'T01||!!|First task',
    'T02||!|First task',
    'T03|||First task',
    'T04|||First task',
    'T05|x|!!!!|Second task',
    'T02||!|First task',
    'T03|||First task',
    'T04|||First task',
    'T05|x|!!!!|Second task',
    'T05|x|!|Second task',
    'T06|t|!!!!|Third task',
    'T07|s||Fourth task'
];

const header = processHeader(dummyCSV[0]!);
const tasks = (() => {
    const a:Task[] = [];
    for(let i = 1; i < dummyCSV.length; i++)
        a.push(processRow(dummyCSV[i]!, header)!);
    return a;
})();
const file = toFile(tasks.filter(t => !!t));
console.log(dummyCSV.join('\n'), '\n');
console.log(file);