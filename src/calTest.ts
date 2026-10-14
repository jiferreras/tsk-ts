import chalk from "chalk";

const WIDTH = 20;
const HEIGHT = 8;
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function generateCalendar(
    year: number,
    month: number,
    currDay: number = -1,
    eventDays: number[] = []
): string[] {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const lines: string[] = [];

    const header = `${monthNames[month - 1]} ${year}`;
    const padding = Math.floor((WIDTH - header.length) / 2);
    lines.push(" ".repeat(padding) + header);

    lines.push(dayNames.join(" "));

    let currentLine = " ".repeat(firstDay * 3);

    for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = (() => {
            const s = day.toString().padStart(2, " ");
            if (day == currDay) return chalk.bgWhite.black(s);
            if (eventDays.indexOf(day) != -1) return chalk.bgCyan.black(s);
            return s;
        })();
        currentLine += dayStr + " ";

        if ((firstDay + day - 1) % 7 === 6) {
            lines.push(currentLine.trimEnd());
            currentLine = "";
        }
    }

    if (currentLine.trim()) {
        lines.push(currentLine.trimEnd());
    }

    while (lines.length < HEIGHT) {
        lines.push("");
    }

    return lines.map(l => l.padEnd(WIDTH));
}

console.clear();
console.log(
    generateCalendar(
        2026, 10, 13,
        [13, 23, 24]
    ).join(' |\n')
);