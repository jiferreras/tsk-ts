type CommandOption = {
    key: string,
    aliases: string[],
    default?: string,
}

type Command = {
    args: string[],
    options: { [k:string]: string | true },
}

function processArgs(
    argv: string[],
    options: CommandOption[] = [],
    strict: boolean = false
): Command | null {
    const args = [...argv].slice(2);
    const optArgs = filterOptionArgs(args);
    const command: Command = {
        args: args,
        options: {}
    };

    const optLookup = new Map<string, string>();
    options.forEach(opt => {
        opt.aliases.forEach(alias => optLookup.set(alias, opt.key));
        if(opt.default) command.options[opt.key] = opt.default;
    });

    for(let i = 0; i < optArgs.length; i++) {
        const opt = optArgs[i]!;
        const key = optLookup.get(opt[0]);

        if(!key && strict) {
            console.log(`ERROR: Unknown flag '${opt[0]}'`);
            return null;
        }
        else if(key) command.options[key] = opt[1] ?? true;
    }

    return command;
}

function option(key: string, aliases: string[], defaultValue?: string): CommandOption {
    return {
        key, aliases, default: defaultValue
    };
}

type OptionKeyVal = [ string, string | null ];
function filterOptionArgs(argv:string[]): OptionKeyVal[] {
    const opts: OptionKeyVal[] = [];
    let i = 0;
    while(i < argv.length) {
        const arg = argv[i];
        if(arg && arg.startsWith('-')) {
            const optArg = argv.splice(i, 1)[0]!;
            const valStart = optArg.indexOf('=') + 1;
            opts.push(
                !valStart ?
                [optArg, null] :
                [optArg.slice(0, valStart - 1), optArg.slice(valStart)]
            );
        }
        else i++;
    }

    return opts;
}

export {
    processArgs,
    option,
};