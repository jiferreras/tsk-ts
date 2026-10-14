import File from './file'

enum TaskState {
    Default = 0,
    Completed,
    Note,
}

class Task {
    id: string = "";
    state: TaskState = TaskState.Default;
    weight: number = 0;
    text: string = "";
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