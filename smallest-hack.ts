import { NS } from '@ns'
import { Costs, MyScriptNames } from '/globals';
import { minimalGrow, minimalHack, minimalWeaken } from '/process-launchers';

const sourceMemoryAllocation = 0.8;
const maxHack = 0.9;

export async function main(ns : NS) : Promise<void> {
    if (ns.args.length != 2) {
        ns.tprint(`Usage: smallest-hack <source> <target>`);
        return;
    }

    const source = <string>ns.args[0];
    const target = <string>ns.args[1];

    while (true) {
        if (needWeaken(ns, target)) {
            await doWeaken(ns, source, target);
        }
        else if (needGrow(ns, target)) {
            await doGrow(ns, source, target);
        }
        else {
            await doHack(ns, source, target);
        }
    }
}

function needGrow(ns: NS, target: string): boolean {
    return ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.99;
}

function needWeaken(ns: NS, target: string): boolean {
    return ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)*1.01;
}

async function doHack(ns: NS, source: string, target: string): Promise<void> {
    const maxThreads = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.MinimalHack));
    const idealThreads = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target, maxHack)));

    const actualThreads = Math.min(maxThreads, idealThreads);

    minimalHack(ns, source, target, actualThreads);
    await ns.sleep(ns.getHackTime(target) + 1000);
}

async function doGrow(ns: NS, source: string, target: string): Promise<void> {
    const maxThreads = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.MinimalGrow));
    const idealThreads = Math.max(ns.growthAnalyze(target, ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target)), 1);

    const actualThreads = Math.min(maxThreads, idealThreads);

    minimalGrow(ns, source, target, actualThreads);
    await ns.sleep(ns.getGrowTime(target) + 1000);
}

async function doWeaken(ns: NS, source: string, target: string): Promise<void> {
    const maxThreads = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.MinimalWeaken));
    const idealThreads = Math.ceil(
        (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target))
            / Costs.weakenSecurityReductionPerThread
    );

    const actualThreads = Math.min(maxThreads, idealThreads);

    minimalWeaken(ns, source, target, actualThreads);
    await ns.sleep(ns.getWeakenTime(target) + 1000);
}

function serverMemory(ns: NS, source: string): number {
    return ns.getServerMaxRam(source);
}