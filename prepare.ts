import { NS } from '@ns'
import { Ports } from '/globals';
import { HackMessageQueue } from '/hack-message-queue';
import { PortLogger, PortLoggerType } from '/port-logger';
import { grow, weaken } from '/process-launchers';

interface Input {
    target: string,
    source: string,
    weakenThreads: number,
    growThreads: number,
    memory: number
}

const endBufferMilliseconds = 1000;
const logger = new PortLogger(PortLoggerType.LogDefault);

export async function main(ns : NS) : Promise<void> {
    for (let i=0; i<=4; i++) {
        if (!ns.args[0]) { 
            throw `Missing arguments`;
        }
    }

    const source = <string>ns.args[0];
    const target = <string>ns.args[1];
    const inputWeakenThreads = <number>ns.args[2];
    const inputGrowThreads = <number>ns.args[3];
    const memory = <number>ns.args[4];

    const input: Input = {
        target: target,
        source: source,
        weakenThreads: inputWeakenThreads,
        growThreads: inputGrowThreads,
        memory: memory
    }

    await doPrepare(ns, input);
}

async function doPrepare(ns:NS, input: Input) {
    await logger.log(ns, `Preparing target ${input.target} with ${input.growThreads} grows`
        + ` and ${input.weakenThreads} weakens, memory ${input.memory}GB used`);

    weaken(ns, input.source, input.target, input.weakenThreads);
    grow(ns, input.source, input.target, input.growThreads);

    await ns.sleep(ns.getWeakenTime(input.target) + endBufferMilliseconds);

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