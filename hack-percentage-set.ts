import { NS } from '@ns'
import { starterOffsetTimeMilliseconds } from '/hack-percentage-lib';
import { PortLogger, PortLoggerType } from '/port-logger';
import { grow, hack, launchHackCyclePart, weaken } from '/process-launchers';

const logger = new PortLogger(PortLoggerType.LogDefault);
const completionBuffer = 1000;

interface Input {
    target: string,
    source: string,
    weakenThreads: number,
    growThreads: number,
    hackThreads: number,
    repetitions: number,
    memory: number
}

export const hackSetArgumentTarget = 1;
export const hackSetArgumentMemory = 6;

export async function main(ns : NS) : Promise<void> {
    const input = parseArgs(ns);

    await logger.log(ns, `Hacking target ${input.target} with ${input.growThreads} grows, `
        + `${input.weakenThreads} weakens and ${input.hackThreads} hacks, `
        + ` repetitions = ${input.repetitions}, memory ${input.memory}GB used`);

    const weakenTime = ns.getWeakenTime(input.target);

    const repsMax = Math.max(input.repetitions, 1);
    try {
        for (let i=1; i<=repsMax; i++) {
            launchHackCyclePart(ns, input.source, input.target, 
                input.weakenThreads, input.growThreads, input.hackThreads, 
                input.memory, (i === repsMax));
            await ns.sleep(starterOffsetTimeMilliseconds);
        }

        // wait out until the end
        await ns.sleep(weakenTime + completionBuffer);
    }
    catch (e) {
        await logger.log(ns, `Error occurred while hacking percentage: ${e}`);
    }
}

function parseArgs(ns: NS): Input {
    for (let i=0; i<=6; i++) {
        if (!ns.args[i]) {
            throw "Missing arguments.";
        }
    }
    
    const source = <string>ns.args[0];
    const target = <string>ns.args[hackSetArgumentTarget];
    const inputWeakenThreads = <number>ns.args[2];
    const inputGrowThreads = <number>ns.args[3];
    const inputHackThreads = <number>ns.args[4]; 
    const repetitions = <number>ns.args[5];
    const memory = <number>ns.args[hackSetArgumentMemory];

    const input: Input = {
        target: target,
        source: source,
        weakenThreads: inputWeakenThreads,
        growThreads: inputGrowThreads,
        hackThreads: inputHackThreads,
        repetitions: repetitions,
        memory: memory
    };

    return input;
}