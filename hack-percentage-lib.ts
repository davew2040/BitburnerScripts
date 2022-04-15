import { NS } from '@ns'
import { Costs, MyScriptNames } from '/globals';

const growWeakenBuffer = 1.1 // Add a small buffer to account for math not always adding up
const securityFocusProportion = 1.2;
export const starterOffsetTimeMilliseconds = 7500;
export const completionBufferTimeMilliseconds = 2500;

export class HackThreadSummary {
    constructor(
        public hack: number,
        public growth: number,
        public weaken: number,
        public percentage: number,
        public repetitions: number) {
    }

    public get total(): number {
        return this.hack + this.growth + this.weaken;
    }

    public totalMemory(ns: NS): number {
        return this.repetitions * 
            (this.hack * ns.getScriptRam(MyScriptNames.Hack)
                + this.growth * ns.getScriptRam(MyScriptNames.Grow)
                + this.weaken * ns.getScriptRam(MyScriptNames.Weaken));
    }
}

export class PrepareThreadSummary {
    constructor(
        public growth: number,
        public weaken: number) {
    }

    public get total(): number {
        return this.growth + this.weaken;
    }

    public totalMemory(ns: NS): number {
        return this.growth * ns.getScriptRam(MyScriptNames.Grow)
            + this.weaken * ns.getScriptRam(MyScriptNames.Weaken);
    }
}

export function getTotalThreadsForAttack(ns: NS, source: string, target: string, hackPercent: number): HackThreadSummary {
    if (hackPercent > .999 || hackPercent < 0.001) {
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

    return new HackThreadSummary(
        Math.ceil(requiredHackThreads), 
        Math.ceil(requiredGrowthThreads), 
        Math.ceil(requiredWeakenThreads), 
        hackPercent,
        1);
}

export function getPrepareSummary(ns:NS, source: string, target: string, maxMemory: number): PrepareThreadSummary { 
    const summary = choosePrepareSummary(ns, source, target);
    const scaledSummary = scalePrepareToMaxMemory(ns, summary, maxMemory);

    return new PrepareThreadSummary(
        Math.ceil(Math.max(scaledSummary.growth, 1)),
        Math.ceil(Math.max(scaledSummary.weaken, 1))
    );
}

function getMixedGrowWeakenSummary(ns:NS, source: string, target: string): PrepareThreadSummary {
    const prepareGrowThreads = Math.ceil(
        growWeakenBuffer * ns.growthAnalyze(
            target,  
            ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target),
            ns.getServer(source).cpuCores
        )
    );
    const securityDeficit = (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target))
        + (prepareGrowThreads * Costs.growSecurityCostPerThread);
    const prepareWeakenThreads = securityDeficit / Costs.weakenSecurityReductionPerThread;

    const summary = new PrepareThreadSummary(
        growWeakenBuffer*prepareGrowThreads, 
        growWeakenBuffer*prepareWeakenThreads
    );

    return summary;
}

function getWeakenOnlySummary(ns:NS, target: string): PrepareThreadSummary {
    const securityDeficit = (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target));
    const prepareWeakenThreads = securityDeficit / Costs.weakenSecurityReductionPerThread;

    const summary = new PrepareThreadSummary(
        0, 
        growWeakenBuffer*prepareWeakenThreads
    );

    return summary;
}

function choosePrepareSummary(ns:NS, source: string, target: string): PrepareThreadSummary {
    const securityProportion = (ns.getServerSecurityLevel(target)/ns.getServerMinSecurityLevel(target));

    if (securityProportion > securityFocusProportion) {
        return getWeakenOnlySummary(ns, target);
    }
    else {
        return getMixedGrowWeakenSummary(ns, source, target);
    }
}

export function getIdealHackRepetitions(ns: NS, target: string, maxConcurrent: number): number {
    const hackTime = ns.getHackTime(target);

    const increments = (hackTime / (starterOffsetTimeMilliseconds + 3000))-1;

    const capped = Math.max(Math.floor(increments), 1);
    return Math.min(capped, maxConcurrent);
}

function scalePrepareToMaxMemory(ns: NS, summary: PrepareThreadSummary, maxMemory: number)
        : PrepareThreadSummary {
    const totalScriptMemory = summary.growth * ns.getScriptRam(MyScriptNames.Grow) 
        + summary.weaken * ns.getScriptRam(MyScriptNames.Weaken);

    // we're okay with scaling up unnecessarily
    const ratio = maxMemory / totalScriptMemory;
    return new PrepareThreadSummary(ratio * summary.growth, ratio * summary.weaken);
}