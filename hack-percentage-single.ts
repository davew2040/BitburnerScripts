import { NS } from '@ns'
import { notStrictEqual } from 'assert';
import { stubTrue } from 'lodash';
import { Costs, MyScriptNames, ServerNames } from '/globals';
import { PortLogger, PortLoggerType } from '/port-logger';
import { grow, hack, weaken } from '/process-launchers';
import { serverStore } from '/server-store';
import { getServerMemoryAvailable } from '/utilities';

const logger = new PortLogger(PortLoggerType.LogTemp);
const completionBufferTimeMilliseconds = 1500;

interface Input {
    target: string,
    source: string,
    weakenThreads: number,
    growThreads: number,
    hackThreads: number
}

export async function main(ns : NS) : Promise<void> {
    await logger.log(ns, `starting hack set single`);

    if (!ns.args[0] || !ns.args[1] || !ns.args[2] || !ns.args[3] || !ns.args[4]) {
        throw "Missing arguments.";
    }

    const source = <string>ns.args[0];
    const target = <string>ns.args[1];
    const inputWeakenThreads = <number>ns.args[2];
    const inputGrowThreads = <number>ns.args[3];
    const inputHackThreads = <number>ns.args[4]; 

    const input: Input = {
        target: target,
        source: source,
        weakenThreads: inputWeakenThreads,
        growThreads: inputGrowThreads,
        hackThreads: inputHackThreads
    }
     
    try {
        const weakenTime = ns.getWeakenTime(target);
        const growTime = ns.getGrowTime(target);
        const hackTime = ns.getHackTime(target);

        ns.tprint(`weaken time = ${weakenTime}`)
        ns.tprint(`grow time = ${growTime}`)
        ns.tprint(`hack time = ${hackTime}`)

        weaken(ns, source, target, input.hackThreads);
        await ns.sleep((weakenTime-growTime)-completionBufferTimeMilliseconds);
        grow(ns, source, target, input.growThreads);
        await ns.sleep((growTime-hackTime)-completionBufferTimeMilliseconds);
        hack(ns, source, target, input.hackThreads);
        await ns.sleep(completionBufferTimeMilliseconds+hackTime);

        await logger.log(ns, 'COMPLETED SINGLE HACK CYCLE');
    }
    catch (e) {
        await logger.log(ns, `Error occurred while hacking percentage: ${e}`);
    }
}