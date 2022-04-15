import { NS } from '@ns'
import { Costs, MyScriptNames } from '/globals';
import { getTotalThreadsForAttack, HackThreadSummary } from '/hack-percentage-lib';
import { grow, hack, weaken } from '/process-launchers';

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

    while (true) {    
        if (needWeaken(ns, target)) {
            ns.tprint(`Weakening...`);
            await doWeaken(ns, source, target);
        }        
        if (needGrow(ns, target)) {
            ns.tprint(`Growing...`);
            await doGrow(ns, source, target);
        }
        else {
            ns.tprint(`Hacking...`);
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
    const maxThreadsByMemory = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.Hack));
    const amountToHack = Math.min(1 - (ns.getServerMoneyAvailable(target)/ns.getServerMaxMoney(target)), hackMax);
    const idealThreads = Math.ceil(amountToHack / ns.hackAnalyze(target));

    const actualThreads = Math.max(Math.ceil(amountToHack / ns.hackAnalyze(target)), 1);
 
    hack(ns, source, target, actualThreads); 
    await ns.sleep(ns.getHackTime(target) + 1000);
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