import { NS } from '@ns'
import { notStrictEqual } from 'assert';
import { stubTrue } from 'lodash';
import { Costs, MyScriptNames, ServerNames } from '/globals';
import { PortLogger, PortLoggerType } from '/port-logger';
import { grow, hack, launchHackCycleSingle, weaken } from '/process-launchers';
import { serverStore } from '/server-store';
import { getServerMemoryAvailable } from '/utilities';

const logger = new PortLogger(PortLoggerType.LogTemp);
const starterOffsetTimeMilliseconds = 5000;
const repeats = 3;

interface Input {
    target: string,
    source: string,
    weakenThreads: number,
    growThreads: number,
    hackThreads: number
}

export async function main(ns : NS) : Promise<void> {
    if (!ns.args[0] || !ns.args[1] || !ns.args[2] || !ns.args[3]) {
        throw "Missing arguments.";
    }
    
    const target = <string>ns.args[0];
    const source = <string>ns.args[1];
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

    const hackTime = ns.getHackTime(target);

    const increments = hackTime / (starterOffsetTimeMilliseconds + 3000)-1;
    ns.tprint(`Attempting ${increments} sets...`)
     
    try {
        for (let i=1; i<=Math.max(increments,1); i++) {
            ns.tprint(`Launching set...`);
            launchHackCycleSingle(ns, source, target, input.weakenThreads, input.growThreads, input.hackThreads);
            await ns.sleep(starterOffsetTimeMilliseconds);
        }
        await logger.log(ns, `Finished starting set`);
    }
    catch (e) {
        await logger.log(ns, `Error occurred while hacking percentage: ${e}`);
    }
}