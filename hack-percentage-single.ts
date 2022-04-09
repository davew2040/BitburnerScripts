import { NS } from '@ns'
import { HackMessageQueue } from '/hack-message-queue';
import { completionBufferTimeMilliseconds } from '/hack-percentage-lib';
import { PortLogger, PortLoggerType } from '/port-logger';
import { grow, hack, weaken } from '/process-launchers';

const logger = new PortLogger(PortLoggerType.LogTemp);

interface Input {
    target: string,
    source: string,
    weakenThreads: number,
    growThreads: number,
    hackThreads: number,
    memory: number,
    isLastInSeries: boolean
}

export async function main(ns : NS) : Promise<void> {
    const input = parseArgs(ns);
    
    try {
        const weakenTime = ns.getWeakenTime(input.target);
        const growTime = ns.getGrowTime(input.target);
        const hackTime = ns.getHackTime(input.target);

        weaken(ns, input.source, input.target, input.hackThreads);
        await ns.sleep((weakenTime-growTime)-completionBufferTimeMilliseconds);
        grow(ns, input.source, input.target, input.growThreads);
        await ns.sleep((growTime-hackTime)-completionBufferTimeMilliseconds);
        hack(ns, input.source, input.target, input.hackThreads);
        await ns.sleep(completionBufferTimeMilliseconds+hackTime);

        await logger.log(ns, 'COMPLETED SINGLE HACK CYCLE');

        if (input.isLastInSeries) {
            const queue = new HackMessageQueue();
            await queue.enqueue(
                ns, 
                {
                    source: input.source,
                    target: input.target,
                    memory: input.memory
                });
        }
    }
    catch (e) {
        await logger.log(ns, `Error occurred while hacking percentage: ${e}`);
    }
}


function parseArgs(ns: NS): Input {
    if (ns.args.length < 8) {
        throw "Missing arguments.";
    }
    
    const source = <string>ns.args[0];
    const target = <string>ns.args[1];
    const inputWeakenThreads = <number>ns.args[2];
    const inputGrowThreads = <number>ns.args[3];
    const inputHackThreads = <number>ns.args[4]; 
    const memory = <number>ns.args[5];
    const isLast = <boolean>ns.args[6];

    const input: Input = {
        target: target,
        source: source,
        weakenThreads: inputWeakenThreads,
        growThreads: inputGrowThreads,
        hackThreads: inputHackThreads,
        memory: memory,
        isLastInSeries: isLast
    };

    return input;
}