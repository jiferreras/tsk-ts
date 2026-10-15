import File from './file'

enum TaskState {
    Default = 0,
    Completed,
    Note,
}

class Task {
    id: string;
    state: TaskState;
    weight: number;
    text: string;

    constructor(t: Partial<Task>) {
        this.id     = t?.id     ?? Date.now().toString();
        this.state  = t?.state  ?? TaskState.Default;
        this.weight = t?.weight ?? 0;
        this.text   = t?.text   ?? "";
    }
}

function sortTasks(tArr: Task[]) {
    return tArr
        .sort((a, b) => b.weight - a.weight)
        .sort((a, b) => a.state  - b.state )
    ;
}

export {
    TaskState,
    Task,
    sortTasks,
    File,
}