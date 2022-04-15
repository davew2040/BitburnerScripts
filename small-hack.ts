import { NS } from '@ns'
import { Costs, MyScriptNames } from '/globals';
import { getTotalThreadsForAttack, HackThreadSummary } from '/hack-percentage-lib';
import { grow, hack, weaken } from '/process-launchers';

const sourceMemoryAllocation = 0.8;

export async function main(ns : NS) : Promise<void> {
    if (ns.args.length != 4) {
        ns.tprint(`Usage: small-hack <source> <target> <percentage> <concurrent>`);
        return;
    }

    const source = <string>ns.args[0];
    const target = <string>ns.args[1];
    const percentage = <number>ns.args[2];
    const concurrent = <boolean>ns.args[3];

    const threadSummary = getTotalThreadsForAttack(ns, source, target, percentage);
    const memoryRequired = getMemoryRequired(ns, threadSummary, concurrent);

    const memoryAvailable = ns.getServerMaxRam(source) - ns.getServerUsedRam(source);
    if (memoryRequired > memoryAvailable) {
        ns.tprint(`Requiredy memory ${memoryRequired}, have ${memoryAvailable} available`);
        return;
    }

    while (true) {
        if (needGrow(ns, target)) {
            ns.tprint(`Growing...`);
            await doGrow(ns, source, target);
        }
        else if (needWeaken(ns, target)) {
            ns.tprint(`Weakening...`);
            await doWeaken(ns, source, target);
        }
        else {
            ns.tprint(`Hacking...`);
            await doHack(ns, source, target, threadSummary, concurrent);
        }
    }
}

function getMemoryRequired(ns: NS, threadSummary: HackThreadSummary, concurrent: boolean): number {
    if (concurrent) {
        return ns.getScriptRam(MyScriptNames.SmallHack) + threadSummary.totalMemory(ns);
    }
    else {
        return ns.getScriptRam(MyScriptNames.SmallHack) + getMaxMemory(ns, threadSummary);
    }
}

function getMaxMemory(ns: NS, threadSummary: HackThreadSummary): number {
    return Math.max(
        threadSummary.growth * ns.getScriptRam(MyScriptNames.Grow), 
        threadSummary.hack * ns.getScriptRam(MyScriptNames.Hack),
        threadSummary.weaken * ns.getScriptRam(MyScriptNames.Weaken)
    );
}

function needGrow(ns: NS, target: string): boolean {
    return ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.99;
}

function needWeaken(ns: NS, target: string): boolean {
    return ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)*1.01;
}

async function doHack(ns: NS, source: string, target: string, threadSummary: HackThreadSummary, concurrent: boolean): Promise<void> {
    if (concurrent) {
        hack(ns, source, target, threadSummary.hack);
        grow(ns, source, target, threadSummary.growth);
        weaken(ns, source, target, threadSummary.weaken);
        await ns.sleep(ns.getWeakenTime(target) + 1000);
    }
    else {
        hack(ns, source, target, threadSummary.hack);
        await ns.sleep(ns.getHackTime(target) + 1000);
        grow(ns, source, target, threadSummary.growth);
        await ns.sleep(ns.getGrowTime(target) + 1000);
        weaken(ns, source, target, threadSummary.weaken);
        await ns.sleep(ns.getWeakenTime(target) + 1000);
    }
}

async function doGrow(ns: NS, source: string, target: string): Promise<void> {
    const maxThreads = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.Grow));
    const idealThreads = Math.max(ns.growthAnalyze(target, ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target)), 1);

    const actualThreads = Math.min(maxThreads, idealThreads);

    grow(ns, source, target, actualThreads);
    await ns.sleep(ns.getGrowTime(target) + 1000);
}

async function doWeaken(ns: NS, source: string, target: string): Promise<void> {
    const maxThreads = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.Weaken));
    const idealThreads = Math.ceil(
        (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target))
        / Costs.weakenSecurityReductionPerThread
    );

    const actualThreads = Math.min(maxThreads, idealThreads);

    weaken(ns, source, target, actualThreads);
    await ns.sleep(ns.getWeakenTime(target) + 1000);
}

function serverMemory(ns: NS, source: string): number {
    return ns.getServerMaxRam(source) * sourceMemoryAllocation 
        - ns.getScriptRam(MyScriptNames.SmallHack);
}