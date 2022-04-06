import { NS } from '@ns'
import { Server } from 'http';
import { Costs, MyScriptNames, ServerNames } from '/globals';
import { launchHackCycle } from '/process-launchers';
import { serverStore } from '/server-store';
import { getServerMemoryAvailable } from '/utilities';

const growWeakenBuffer = 1.1 // Add a small buffer to account for math not always adding up
let maxPercentage = 0.50;

export async function main(ns : NS) : Promise<void> {
    startAttackCycle(ns);
}

function startAttackCycle(ns: NS) {
    if (ns.args[0] && typeof ns.args[0] === "number") {
        if (ns.args[0] > 0 && ns.args[0] < 1) {
            maxPercentage = ns.args[0];
        }
        else {
            maxPercentage = ns.args[0] / 100;
        }
    }

    allocateTargetsToServers(
        ns, 
        serverStore.getSourceServers(ns), 
        getCandidateTargets(ns),
        getServerFreeMemoryProfile(ns)
    );
}

function getCandidateTargets(ns:NS): Array<string> {
    return serverStore.getPotentialTargets(ns).filter(server => isCandidateTarget(ns, server));
}

function isCandidateTarget(ns:NS, targetHost: string): boolean {
    return ns.getServerMoneyAvailable(targetHost) > 0
        && ns.getServerMaxMoney(targetHost) > 0
        && ns.getServerRequiredHackingLevel(targetHost) <= ns.getHackingLevel();
}

function getTotalThreadsForAttack(ns: NS, source: string, target: string, hackPercent: number): HackThreadSummary {
    if (hackPercent > .995 || hackPercent < 0.005) {
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

function allocateTargetsToServers(ns: NS, sources: Array<string>, targets: Array<string>, freeMemoryMap: Map<string, number>): void {
    let orderedSources = [...sources];

    const orderedTargets = [...targets]
        .sort((a, b) => {
            return ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a);
        });

    for (const target of orderedTargets) {
        if (orderedSources.length === 0) {
            return;
        }

        orderedSources = orderedSources.sort((a, b) => {
            return <number>freeMemoryMap.get(b) - <number>freeMemoryMap.get(a);
        });

        const source = orderedSources[0];

        const optimalPercentage = getOptimalHackPercentage(ns, source, target, maxPercentage, freeMemoryMap);
        if (optimalPercentage === 0) {
            continue;
        }
        const threadSummary = getTotalThreadsForAttack(ns, source, target, optimalPercentage);

        ns.tprint(`Launching hacks on ${target} from ${source} for ${Math.round(optimalPercentage*100)}% of money`);

        launchHackCycle(ns, ServerNames.Home, source, target, 
            threadSummary.weaken, threadSummary.growth, threadSummary.hack);

        updateFreeMemoryMap(ns, freeMemoryMap, source, threadSummary);
    }
}

function getOptimalHackPercentage(ns: NS, source: string, target: string, maxPercent = 0.99, freeMemoryMap: Map<string, number>): number {
    for (let i=maxPercent; i>0; i -= 0.01) {
        const threadsBreakdown = getTotalThreadsForAttack(ns, source, target, i);
        if (allocationFitsInHost(ns, source, hackSummaryToMap(threadsBreakdown), freeMemoryMap)) {
            return i;
        }
    }
    return 0;
}

function hackSummaryToMap(summary: HackThreadSummary): Map<string, number> {
    const map = new Map<string, number>();

    map.set(MyScriptNames.Grow, summary.growth);
    map.set(MyScriptNames.Weaken, summary.weaken);
    map.set(MyScriptNames.Hack, summary.hack);

    return map;
}

function allocationFitsInHost(ns: NS, sourceName: string, scriptAllocation: Map<string, number>, freeMemoryMap: Map<string, number>): boolean {
    let memoryRequired = 0;

    for (const kvp of scriptAllocation) {
        memoryRequired += ns.getScriptRam(kvp[0]) * kvp[1];
    }

    return <number>freeMemoryMap.get(sourceName) > memoryRequired;
}

function updateFreeMemoryMap(ns: NS, freeMemoryMap: Map<string, number>, source: string, hackThreadSummary: HackThreadSummary): void {
    let serverFreeMemory = <number>freeMemoryMap.get(source);

    serverFreeMemory -= hackThreadSummary.hack * ns.getScriptRam(MyScriptNames.Hack);
    serverFreeMemory -= hackThreadSummary.growth * ns.getScriptRam(MyScriptNames.Grow);
    serverFreeMemory -= hackThreadSummary.weaken * ns.getScriptRam(MyScriptNames.Weaken);

    freeMemoryMap.set(source, serverFreeMemory);
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