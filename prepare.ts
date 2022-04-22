import { NS } from '@ns'
import { Ports } from '/globals';
import { HackMessageQueue } from '/hack-message-queue';
import { getGrowThreadsForMemory, getWeakenThreadsForMemory, needsGrow, needsWeaken } from '/hack-percentage-lib';
import { PortLogger, PortLoggerType } from '/port-logger';
import { grow, weaken } from '/process-launchers';

interface Input {
    target: string,
    source: string,
    memory: number
}

export const prepareArgumentTarget = 1;
export const prepareArgumentMemory = 2;

const endBufferMilliseconds = 1000;
const logger = new PortLogger(PortLoggerType.LogDefault);

export async function main(ns : NS) : Promise<void> {
    for (let i=0; i<=2; i++) {
        if (!ns.args[i]) { 
            throw `Missing arguments`;
        }
    }

    const source = <string>ns.args[0];
    const target = <string>ns.args[prepareArgumentTarget];
    const memory = <number>ns.args[prepareArgumentMemory];

    const input: Input = {
        target: target,
        source: source,
        memory: memory
    }

    await doPrepare(ns, input);
}

async function doPrepare(ns:NS, input: Input) {
    await logger.log(ns, `Preparing target ${input.target} with max memory ${input.memory}GB`);

    while (true) {
        if (needsWeaken(ns, input.target)) {
            const threads = Math.max(1, getWeakenThreadsForMemory(ns, input.source, input.target, input.memory));
            weaken(ns, input.source, input.target, threads);
            await ns.sleep(ns.getWeakenTime(input.target) + endBufferMilliseconds);
        }
        else if (needsGrow(ns, input.target)) {
            const threads = Math.max(1, getGrowThreadsForMemory(ns, input.source, input.target, input.memory));
            grow(ns, input.source, input.target, threads);
            await ns.sleep(ns.getGrowTime(input.target) + endBufferMilliseconds);
        }
        else {
            break;
        }
    }

    const queue = new HackMessageQueue();
    await queue.enqueue(
        ns, 
        {
            source: input.source,
            target: input.target,
            memory: input.memory
        }
    );
}