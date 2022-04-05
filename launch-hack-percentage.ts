import { NS } from '@ns'
import { Server } from 'http';
import { Costs, MyScriptNames, ServerNames } from '/globals';
import { launchHackCycle } from '/process-launchers';
import { serverStore } from '/server-store';

const homeScriptMemory = 0.8;
const otherServerScriptMemory = 0.9;
const growWeakenBuffer = 1.1 // Add a small buffer to account for math not always adding up

export async function main(ns : NS) : Promise<void> {
    startAttackCycle(ns);
}

function startAttackCycle(ns: NS) {
    // const source = "home";
    // const target = "phantasy";
    
    // const optimalPercentage = getOptimalHackPercentage(ns, source, target);
    // const totalThreads = getTotalThreadsForAttack(ns, source, target, optimalPercentage);
    
    // launchHackCycle(ns, source, target, totalThreads.weaken, totalThreads.growth, totalThreads.hack);

    allocateTargetsToServers(ns, serverStore.getSourceServers(ns), getCandidateTargets(ns));
}

function getCandidateTargets(ns:NS): Array<string> {
    return serverStore.getPotentialTargets(ns).filter(server => isCandidateTarget(ns, server));
}

function isCandidateTarget(ns:NS, targetHost: string): boolean {
    return ns.getServerMoneyAvailable(targetHost) > 0
        && ns.getServerMaxMoney(targetHost) > 0
        && ns.getServerRequiredHackingLevel(targetHost) < 400;
}

function getTotalThreadsForAttack(ns: NS, source: string, target: string, hackPercent: number): HackThreadSummary {
    if (hackPercent > .99 || hackPercent < 0.01) {
        throw "hackPercent must be between 0 and 1";
    }

    const singleThreadHack = ns.hackAnalyze(target);
    const requiredHackThreads = Math.floor(hackPercent / singleThreadHack);
    const requiredGrowthPercent = 1/(1-hackPercent);
    const requiredGrowthThreads = growWeakenBuffer * Math.ceil(ns.growthAnalyze(target, requiredGrowthPercent, ns.getServer(source).cpuCores));
    const securityDeficit = (requiredGrowthThreads * Costs.growSecurityCostPerThread)
        + (requiredHackThreads * Costs.hackSecurityCostPerThread)
        + (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target));
    const requiredWeakenThreads = Math.ceil(growWeakenBuffer * (securityDeficit / Costs.weakenSecurityReductionPerThread));

    return new HackThreadSummary(requiredHackThreads, requiredGrowthThreads, requiredWeakenThreads);
}

function getServerFreeMemoryProfile(ns: NS): Map<string, number> {
    const map = new Map<string, number>();

    for (const source of serverStore.getSourceServers(ns)) {
        map.set(source, getServerMemoryAvailable(ns, source));
    }

    return map;
}

function allocateTargetsToServers(ns: NS, sources: Array<string>, targets: Array<string>): void {
    const orderedSources = [...sources].sort((a, b) => {
        return getServerMemoryAvailable(ns, b) - getServerMemoryAvailable(ns, a);
    });
    const orderedTargets = [...targets]
        .sort((a, b) => {
            return ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a);
        });

    for (const target of orderedTargets) {
        if (orderedSources.length === 0) {
            return;
        }

        const source = <string>orderedSources.shift();

        const optimalPercentage = getOptimalHackPercentage(ns, source, target);
        const threadSummary = getTotalThreadsForAttack(ns, source, target, optimalPercentage);

        ns.tprint(`Launching hacks on ${target} from ${source} for ${optimalPercentage*100}% of money`);

        launchHackCycle(ns, ServerNames.Home, source, target, 
            threadSummary.weaken, threadSummary.growth, threadSummary.hack);
    }
}

function getOptimalHackPercentage(ns: NS, source: string, target: string): number {
    for (let i=0.99; i>0; i -= 0.01) {
        const threadsBreakdown = getTotalThreadsForAttack(ns, source, target, i);
        if (allocationFitsInHost(ns, source, hackSummaryToMap(threadsBreakdown))) {
            return i;
        }
    }
    throw "Found no valid hacking percentage.";
}

function hackSummaryToMap(summary: HackThreadSummary): Map<string, number> {
    const map = new Map<string, number>();

    map.set(MyScriptNames.Grow, summary.growth);
    map.set(MyScriptNames.Weaken, summary.weaken);
    map.set(MyScriptNames.Hack, summary.hack);

    return map;
}

function allocationFitsInHost(ns: NS, sourceName: string, scriptAllocation: Map<string, number>): boolean {
    let memoryRequired = 0;

    for (const kvp of scriptAllocation) {
        memoryRequired += ns.getScriptRam(kvp[0]) * kvp[1];
    }

    return getServerMemoryAvailable(ns, sourceName) > memoryRequired;
}

function updateFreeMemoryMap(ns: NS, freeMemoryMap: Map<string, number>, threadsAllocation: Map<string, number>, scriptName: string): void {
    for (const memoryKey of freeMemoryMap.keys()) {
        if (threadsAllocation.has(memoryKey)) {
            const currentMemoryFree = <number>freeMemoryMap.get(memoryKey);
            const newMemoryFree = currentMemoryFree - (<number>threadsAllocation.get(memoryKey) * ns.getScriptRam(scriptName));
            freeMemoryMap.set(memoryKey, newMemoryFree);
        }
    }
}

function getServerVirtualThreadCapacity(ns: NS, scriptName: string, sourceName: string, 
        freeMemoryMap: Map<string, number>): number {
    return operationMultiplier(ns, sourceName, scriptName) 
        * (<number>freeMemoryMap.get(sourceName) / ns.getScriptRam(scriptName));
}

function operationMultiplier(ns: NS, sourceName: string, scriptName: string): number {
    if (sourceName === ServerNames.Home 
        && (scriptName === MyScriptNames.Grow || MyScriptNames.Weaken)) {
        return ns.getServer(ServerNames.Home).cpuCores;
    }

    return 1;
}

function getServerMemoryAvailable(ns: NS, sourceName: string) : number {
    if (sourceName === ServerNames.Home) {
        return ns.getServerMaxRam(sourceName)*homeScriptMemory - ns.getServerUsedRam(sourceName);
    }
    else {
        return ns.getServerMaxRam(sourceName)*otherServerScriptMemory - ns.getServerUsedRam(sourceName)
    }
}

class HackThreadSummary {
    constructor(
        public hack: number,
        public growth: number,
        public weaken: number) {
    }

    public get total(): number {
        return this.hack + this.growth + this.weaken;
    }
}