import { NS } from '@ns'
import { Costs, MyScriptNames } from '/globals';
import { getCurrentTotalThreadsForAttack, getOptimalHackPercentageBinarySearch, HackThreadSummary } from '/hack-percentage-lib';
import { grow, hack, launchHackCyclePart, weaken } from '/process-launchers';

const sourceMemoryAllocation = 0.8;
const hackMax = 0.9;

export async function main(ns : NS) : Promise<void> {
    if (ns.args.length != 3) {
        ns.tprint(`Usage: fixed-hack <source> <target> <memory>`);
        return;
    }

    const source = <string>ns.args[0];
    const target = <string>ns.args[1];
    const fixedMemoryAllocation = <number>ns.args[2];

    const memoryAvailable = ns.getServerMaxRam(source) - ns.getServerUsedRam(source);

    if (fixedMemoryAllocation > memoryAvailable) {
        ns.tprint(`ERROR: Requires ${fixedMemoryAllocation} and have ${memoryAvailable}`)
        return;
    }

    let idealThreads = getOptimalHackPercentageBinarySearch(ns, source, target, 0.999, fixedMemoryAllocation, 1);

    if (!idealThreads) {
        ns.tprint(`ERROR: No thread configuration will fit into memory ${memoryAvailable}GB`);
        return;
    }

    while (true) { 

        if (needWeaken(ns, target)) {
            await doWeaken(ns, source, target);
        }        
        if (needGrow(ns, target)) {
            await doGrow(ns, source, target);
        }
        else {
            idealThreads = getOptimalHackPercentageBinarySearch(ns, source, target, 0.999, fixedMemoryAllocation, 1);
            await doHack(ns, source, target, <HackThreadSummary>idealThreads);
        }
    }
}

function needGrow(ns: NS, target: string): boolean {
    return ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.99;
}

function needWeaken(ns: NS, target: string): boolean {
    return ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)*1.01;
}

async function doHack(ns: NS, source: string, target: string, threadSummary: HackThreadSummary): Promise<void> {
    grow(ns, source, target, threadSummary.growth);
    hack(ns, source, target, threadSummary.hack);
    weaken(ns, source, target, threadSummary.weaken);

    await ns.sleep(ns.getWeakenTime(target) + 1000);
}

async function doGrow(ns: NS, source: string, target: string): Promise<void> {
    const maxThreads = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.Grow));

    grow(ns, source, target, maxThreads);
    await ns.sleep(ns.getGrowTime(target) + 1000);
}

async function doWeaken(ns: NS, source: string, target: string): Promise<void> {
    const maxThreads = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.Weaken));
    
    weaken(ns, source, target, maxThreads);
    await ns.sleep(ns.getWeakenTime(target) + 1000);
}

function serverMemory(ns: NS, source: string): number {
    return ns.getServerMaxRam(source) * sourceMemoryAllocation 
        - ns.getScriptRam(MyScriptNames.SmallHack);
}