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

let cursor = -1;
let selStart = cursor;
let selEnd = cursor;
let initialText = 'UNITIALIZED';
let text = 'UNITIALIZED'; 
let exitCb: (result: string) => void;

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

function onKey(key: string, shift: boolean, ctrl: boolean): boolean {
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
        case 'escape': {
            exitCb!(initialText);
            return true;
        }
        case 'return': {
            exitCb!(text);
            return true;
        }
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

function init(t: string, exitCallback: (result: string) => void) {
    initialText = t;
    text = t;
    cursor = selStart = selEnd = t.length;
    exitCb = exitCallback;
}

function getState() {
    const line = text + ' ';
    if (selStart == selEnd) {
        return [
            line.slice(0, cursor),
            C.whiteBg,
            line.slice(cursor, cursor + 1),
            C.reset,
            line.slice(cursor + 1),
            C.hideCursor
        ].join('');
    }
    else {
        return [
            line.slice(0, selStart),
            C.cyanBg,
            line.slice(selStart, selEnd),
            C.reset,
            line.slice(selEnd),
            C.hideCursor
        ].join('');
    }
}

function onKeypress(str: string, key: any) {
    const processKey = !onKey(key.name, key.shift, key.ctrl);
    const enteredText = !key.ctrl && !key.meta && str;
    if(processKey && enteredText) {
        text = text.slice(0, selStart) + str + text.slice(selEnd);
        cursor = selStart = selEnd = cursor + str.length;
    }
}

function renderStatus() {
    console.log(`${C.cyanBg}EDIT Escape=Cancel${C.reset}`);
}

export default {
    init,
    getState,
    onKeypress,
    renderStatus
}