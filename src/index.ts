import InteractiveMode from "./interactive";
import { processArgs } from "./lib/cli";

// TODO: implement actions, flags
const command = processArgs(process.argv);
if(!command) {
    process.exit(1);
}
if(command.args.length == 0) {
    console.log("ERROR: No task file specified.");
    console.log(`USAGE: ${process.argv0} <file>`);
    process.exit(1);
}

InteractiveMode.start(command.args[0]!);