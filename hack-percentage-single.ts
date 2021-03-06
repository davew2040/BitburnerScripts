import { NS } from '@ns'
import { HackMessageQueue } from '/hack-message-queue';
import { completionBufferTimeMilliseconds } from '/hack-percentage-lib';
import { PortLogger, PortLoggerType } from '/port-logger';
import { grow, hack, weaken } from '/process-launchers';

const logger = new PortLogger(PortLoggerType.LogTemp);

export const hackSingleArgumentTarget = 1;
export const hackSingleArgumentMemory = 5;

interface Input {
    target: string,
    source: string,
    weakenThreads: number,
    growThreads: number,
    hackThreads: number,
    memory: number
}

export async function main(ns : NS) : Promise<void> {
    const input = parseArgs(ns);
    
    try {
        const weakenTime = ns.getWeakenTime(input.target);
        
        weaken(ns, input.source, input.target, input.weakenThreads);
        grow(ns, input.source, input.target, input.growThreads);
        hack(ns, input.source, input.target, input.hackThreads);

        await ns.sleep(weakenTime + completionBufferTimeMilliseconds);

        await logger.log(ns, 'COMPLETED SINGLE HACK CYCLE');

        const queue = new HackMessageQueue();
        await queue.enqueue(
            ns, 
            {
                source: input.source,
                target: input.target,
                memory: input.memory
            });
    }
    catch (e) {
        await logger.log(ns, `Error occurred while doing single hack cycle: ${e}`);
    }
}


function parseArgs(ns: NS): Input {
    if (ns.args.length < 7) {
        throw "Missing arguments.";
    }
    
    const source = <string>ns.args[0];
    const target = <string>ns.args[hackSingleArgumentTarget];
    const inputWeakenThreads = <number>ns.args[2];
    const inputGrowThreads = <number>ns.args[3];
    const inputHackThreads = <number>ns.args[4]; 
    const memory = <number>ns.args[hackSingleArgumentMemory];

    const input: Input = {
        target: target,
        source: source,
        weakenThreads: inputWeakenThreads,
        growThreads: inputGrowThreads,
        hackThreads: inputHackThreads,
        memory: memory
    };

    return input;
}