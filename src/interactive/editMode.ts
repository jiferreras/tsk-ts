import chalk from "chalk";
import { type Action, type InteractiveMode, type KeyEvent, ActionType, EscapeC, getRemainingCount } from ".";
import { TaskState, type Task } from "../lib";

// TODO: Move to common
const STATES_ICONS = [' ', '✓', 'n']

let cursor = -1;
let selStart = cursor;
let selEnd = cursor;
let text = 'UNITIALIZED';

export function setState(
    t: string,
    c?: number,
    sStart?: number,
    sEnd?: number,
) {
    text = t;
    if(c && c < 0) cursor = Math.min(t.length, cursor);
    else cursor = c ?? t.length;
    selStart = sStart ?? cursor;
    selEnd   = sEnd   ?? cursor;
}

const editMode: InteractiveMode = {
    render: function (tasks: Task[], selected: number): void {
        if(tasks.length == 0) {
            console.log("Something is wrong.");
            return;
        }

        let completed = false;
        for(let i = 0; i < tasks.length; i++) {
            const t = tasks[i]!;
            if(t.state == TaskState.Note) continue;
            if(i == 0 && t.state == TaskState.Default) {
                console.log(`Tasks (${getRemainingCount()}):`);
            }
            else if(!completed && t.state == TaskState.Completed) {
                console.log(
                    chalk.grey(`Completed (${tasks.length - getRemainingCount()}):`)
                );
                completed = true;
            }
            
            const sel = selected == i;
            const state = STATES_ICONS[t.state]!;
            const line = `[${
                t.state != TaskState.Completed ?
                state :
                chalk.green(state)
            }] ${sel ? getState() : t.text}`;
            console.log(
                sel ? '  ▶ ' + line : chalk.gray('    ' + line)
            );
        }
    },
    getStatus: function (): string {
        return chalk.gray([
            `[${chalk.whiteBright('Esc')}]Accept`,
            `[${chalk.whiteBright('Enter')}]${text == "" ? 'Cancel' : 'New line'}`,
        ].join(' '));
    },
    onKeypress: function (e: KeyEvent): Action | Action[] {
        const key = e.key;
        switch(key.name) {
            case 'up': {
                if(key.shift) break;
                return { action: ActionType.EditCursorUp, text };
            }
            case 'down': {
                if(key.shift) break;
                return { action: ActionType.EditCursorDown, text };
            }
            case 'escape': {
                return {
                    action: ActionType.EditExit,
                    text: text,
                };
            }
            case 'return': {
                if(text == "")
                    return { action: ActionType.DeleteTask, moveCursor: true };

                const lhs = text.slice(0, selStart);
                const rhs = text.slice(selEnd);
                if(lhs == "") {
                    text = rhs;
                    cursor = 0;
                    return { action: ActionType.NoOp };
                }
                return {
                    action: ActionType.EditNewline,
                    lhs,
                    rhs,
                };
            }
            case 'backspace': {
                if(selEnd != 0) break;
                return {
                    action: ActionType.EditMergePrev,
                    text: text.slice(selEnd)
                };
            }
        }
        
        const isCommand = doCommand(key.name, key.shift, key.ctrl);
        const isStr = e.str && !key.ctrl && !key.meta;

        if(!isCommand && isStr) {
            text = text.slice(0, selStart) + e.str + text.slice(selEnd);
            cursor = selStart = selEnd = cursor + e.str.length;
        }

        return { action: ActionType.NoOp };
    }
}

export default editMode;

function getState() {
    const line = text + ' ';
    const isSelection = selStart != selEnd;
    return [
        line.slice(0, (isSelection ? selStart : cursor)),
        (isSelection ?
            EscapeC.cyanBg :
            EscapeC.whiteBg
        ),
        (isSelection ?
            line.slice(selStart, selEnd) :
            line.slice(cursor, cursor + 1)
        ),
        EscapeC.reset,
        line.slice(isSelection ? selEnd : cursor + 1),
        EscapeC.hideCursor,
    ].join('');
}

function moveCursor(dir: number, ctrl: boolean) {
    let nPos = Math.max(
        0, Math.min(cursor + dir, text.length)
    );
    if(!ctrl) return nPos;
    
    const isAlpha = (c:string) => /^[a-z0-9]$/i.test(c);
    
    const testForAlpha = isAlpha(text[nPos]!);
    while(nPos > 0 && nPos < text.length) {
        if(testForAlpha != isAlpha(text[nPos + dir]!)) break;
        nPos += dir;
    }

    if(dir > 0) nPos++;
    
    return Math.max(
        0, Math.min(nPos, text.length)
    );
}

function doCommand(key: string, shift: boolean, ctrl: boolean): boolean {
    if(ctrl) {
        switch (key) {
            case 'a': {
                selStart = 0;
                selEnd = text.length;
                cursor = 0;
                return true;
            }
        }
    }
    switch (key) {
        case 'left': {
            const nPos = moveCursor(-1, ctrl);
            if (!shift && selStart != selEnd) {
                selEnd = cursor = selStart;
                return true;
            }
            else if (!shift) {
                selStart = selEnd = cursor = nPos;
                return true;
            }
            if (selStart == cursor) selStart = nPos;
            else if (selEnd == cursor) {
                if(nPos <= selStart) {
                    selEnd = selStart;
                    selStart = nPos;
                }
                else selEnd = nPos;
            }
            cursor = nPos;
            return true;
        }
        case 'right': {
            const nPos = moveCursor(+1, ctrl);
            if (!shift && selStart != selEnd) {
                selStart = cursor = selEnd;
                return true;
            }
            else if (!shift) {
                selStart = selEnd = cursor = nPos;
                return true;
            }
            if (selEnd == cursor) selEnd = nPos;
            else if (selStart == cursor) {
                if(nPos >= selEnd) {
                    selStart = selEnd;
                    selEnd = nPos;
                }
                else selStart = nPos;
            }
            cursor = nPos;
            return true;
        }
        case 'backspace': {
            if(selStart == selEnd) {
                if(cursor == 0) return true;
                text = text.slice(0, cursor - 1) + text.slice(cursor);
                cursor--;
                return true;
            }
            else {
                text = text.slice(0, selStart) + text.slice(selEnd);
                cursor = selEnd = selStart;
            }
            return true;
        }
        case 'delete': {
            if(selStart == selEnd) {
                if(cursor == text.length) return true;
                text = text.slice(0, cursor) + text.slice(cursor + 1);
                return true;
            }
            else {
                text = text.slice(0, selStart) + text.slice(selEnd);
                cursor = selEnd = selStart;
            }
            return true;
        }
        case 'up': {
            const nPos = moveCursor(-text.length, ctrl);
            if (!shift && selStart != selEnd) {
                selEnd = cursor = selStart;
                return true;
            }
            else if (!shift) {
                selStart = selEnd = cursor = nPos;
                return true;
            }
            if (selStart == cursor) selStart = nPos;
            else if (selEnd == cursor) {
                if(nPos <= selStart) {
                    selEnd = selStart;
                    selStart = nPos;
                }
                else selEnd = nPos;
            }
            cursor = nPos;
            return true;
        }
        case 'down': {
            const nPos = moveCursor(text.length, ctrl);
            if (!shift && selStart != selEnd) {
                selStart = cursor = selEnd;
                return true;
            }
            else if (!shift) {
                selStart = selEnd = cursor = nPos;
                return true;
            }
            if (selEnd == cursor) selEnd = nPos;
            else if (selStart == cursor) {
                if(nPos >= selEnd) {
                    selStart = selEnd;
                    selEnd = nPos;
                }
                else selStart = nPos;
            }
            cursor = nPos;
            return true;
        }
    }
    return false;
}