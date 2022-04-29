import { NS } from '@ns'
import { pseudoRandomBytes } from 'crypto';
import { exploitServer } from '/explore-lib';
import { Costs, MyScriptNames, ServerNames } from '/globals';
import { minimalGrow, minimalHack, minimalWeaken } from '/process-launchers';
import { serverStore } from '/server-store';
import { exploreServers, exploreServersAsync } from '/utilities';

const sourceMemoryAllocation = 0.8;
const maxHack = 0.9;
const defaultTarget = ServerNames.SigmaCosmetics;

export async function main(ns : NS) : Promise<void> {
    while (true) {
        await exploitAll(ns);

        const sources = getSources(ns);

        for (const source of sources) {
            if (ns.ps(source).length === 0) {   
                await attackWith(ns, source);
            }
        } 

        await ns.sleep(3000);
    }
}

async function exploitAll(ns: NS): Promise<void> {
    await exploreServersAsync(ns, 16, async server => {
        try {
            await exploitServer(ns, server)
        }
        catch (e) {
            //ns.print(e);
        }
    });
}

function hasRunningThreads(ns: NS, sources: Array<string>): boolean {
    for (const source of sources) {
        if (ns.ps(source).length > 0) {
            return true;
        }
    }

    return false;
}

async function attackWith(ns: NS, source: string): Promise<void> {
    const target = pickTarget(ns, source);

    if (needsWeaken(ns, target)) {
        await doWeaken(ns, source, target);
    }
    else if (needGrow(ns, target)) {
        await needsGrow(ns, source, target);
    }
    else {
        await doHack(ns, source, target);
    }
}

function pickTarget(ns: NS, source: string): string {
    if (serverStore.getStolenServers(ns).indexOf(source) !== -1) {
        return source;
    }
    else {
        return defaultTarget;
    }
}

function getSources(ns: NS): Array<string> {
    return serverStore.getStolenServers(ns).filter(s => ns.getServerMaxRam(s) >= 16);
}

function needGrow(ns: NS, target: string): boolean {
    return ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.99;
}

function needsWeaken(ns: NS, target: string): boolean {
    return ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)*1.01;
}

async function doHack(ns: NS, source: string, target: string): Promise<void> {
    const totalAmountToHack = maxHack*ns.getServerMaxMoney(target);
    const maxThreads = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.MinimalHack));
    const idealThreads = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target, totalAmountToHack)));

    const actualThreads = Math.min(maxThreads, idealThreads);

    minimalHack(ns, source, target, actualThreads);
}

async function needsGrow(ns: NS, source: string, target: string): Promise<void> {
    const maxThreads = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.MinimalGrow));
    const idealThreads = Math.max(ns.growthAnalyze(target, ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target)), 1);

    const actualThreads = Math.min(maxThreads, idealThreads);

    minimalGrow(ns, source, target, actualThreads);
}

async function doWeaken(ns: NS, source: string, target: string): Promise<void> {
    const maxThreads = Math.floor(serverMemory(ns, source) / ns.getScriptRam(MyScriptNames.MinimalWeaken));
    // const idealThreads = Math.ceil(
    //     (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target))
    //         / Costs.weakenSecurityReductionPerThread
    // );

    //const actualThreads = Math.min(maxThreads, idealThreads);
    const actualThreads = maxThreads;

    minimalWeaken(ns, source, target, actualThreads);
}

function serverMemory(ns: NS, source: string): number {
    return ns.getServerMaxRam(source);
}