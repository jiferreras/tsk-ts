const separator = '|';

enum TaskProp {
    Id = 'id',
    State = 'state',
    Priority = 'priority',
    Text = 'text'
}

enum TaskState {
    Default = '',
    Completed = 'x',
    Template = 't',
    Scheduled = 's'
}

function ProcessHeader(s: string): TaskProp[] {
    const cols = s.split(separator);
    const h: TaskProp[] = [];

    cols.forEach(p => {
        switch(p) {
            case TaskProp.Id:       h.push(TaskProp.Id);        return;
            case TaskProp.Priority: h.push(TaskProp.Priority);  return;
            case TaskProp.State:    h.push(TaskProp.State);     return;
            case TaskProp.Text:     h.push(TaskProp.Text);      return;
            default: return;
        };
    });

    return h;
}

class Task {
    id: string = "";
    state: TaskState = TaskState.Default;
    priority: number = -1;
    text: string = "";

    static fromString(s: string, header: TaskProp[]): Task {
        let t = new Task();

        return t;
    }

    toString(): string {
        return `${this.id}${separator}${this.state}${separator}${this.priority}${separator}${this.text}`;
    }
}

console.log("Hello, world!");