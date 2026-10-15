import chalk from "chalk";
import { type InteractiveMode, type Action, ActionType, type KeyEvent } from ".";
import { TaskState, type Task } from "../lib";

const STATES_ICONS = [' ', 'x', 'n']

const selectMode: InteractiveMode = {
    render: function (tasks: Task[], selected: number): void {
        console.clear();
        if(tasks.length == 0) {
            console.log("Tasks:")
            console.log(chalk.gray("  No tasks."));
            return;
        }

        let completed = false;
        for(let i = 0; i < tasks.length; i++) {
            const t = tasks[i]!;
            if(t.state == TaskState.Note) continue;
            if(i == 0 && t.state == TaskState.Default)
                console.log("Tasks:");
            else if(!completed && t.state == TaskState.Completed) {
                console.log(chalk.grey("Completed:"))
                completed = true;
            }

            const sel = selected == i;
            const state = STATES_ICONS[t.state]!;
            const line = `[${state}] ${t.text}`;
            if(t.state == TaskState.Default)
                console.log(
                    (sel ? '▶ ' : '  ') + line
                );
            else {
                console.log(
                    chalk.gray((sel ? '▶ ' : '  ') + line)
                );
            }
        }
    },
    getStatus: function (): string {
        return chalk.bgCyan.black.bold(
            'SELECT ↑↓=Cursor Shift+↑↓=Move Enter=Edit q=Quit'
        );
    },
    onKeypress: function (e: KeyEvent): Action | Action[] {
        const key = e.key;
        switch(key.name) {
            case 'up': {
                return {
                    action: (
                        key.shift ?
                        ActionType.MoveUp :
                        ActionType.Up
                    )
                };
            }
            case 'down': {
                return {
                    action: (
                        key.shift ?
                        ActionType.MoveDown :
                        ActionType.Down
                    )
                };
            }
            case 'space': {
                return { action: ActionType.ToggleState };
            }
            case 'return': {
                return { action: ActionType.Edit };
            }
            case 'x': {
                return { action: ActionType.DeleteTask, moveCursor: false };
            }
            case 'n': {
                return [
                    { action: ActionType.NewTask, text: "" },
                    { action: ActionType.Edit }
                ];
            }
            case 'escape':
            case 'q': {
                return { action: ActionType.Exit };
            }
            default: {
                return { action: ActionType.NoOp };
            }
        }
    }
}

export default selectMode;