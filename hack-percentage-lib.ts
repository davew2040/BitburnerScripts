import { NS } from '@ns'
import { Costs, MyScriptNames } from '/globals';
import { getServerMemoryAvailable } from '/utilities';

const growWeakenBuffer = 1.1 // Add a small buffer to account for math not always adding up
export const starterOffsetTimeMilliseconds = 10000;
export const completionBufferTimeMilliseconds = 2500;

export class HackThreadSummary {
    constructor(
        public hack: number,
        public growth: number,
        public weaken: number,
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

    return new HackThreadSummary(
        Math.ceil(requiredHackThreads), 
        Math.ceil(requiredGrowthThreads), 
        Math.ceil(requiredWeakenThreads), 
        1);
}

export function getPrepareSummary(ns:NS, source: string, target: string, maxMemory: number) {
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

    let summary = new PrepareThreadSummary(
        growWeakenBuffer*prepareGrowThreads, 
        growWeakenBuffer*prepareWeakenThreads
    );

    summary = scalePrepareToMaxMemory(ns, summary, maxMemory);

    return new PrepareThreadSummary(
        Math.ceil(Math.max(summary.growth, 1)),
        Math.ceil(Math.max(summary.weaken, 1))
    );
}

export function getHackRepetitions(ns: NS, target: string): number {
    const hackTime = ns.getHackTime(target);

    const increments = hackTime / (starterOffsetTimeMilliseconds + 3000)-1;

    return Math.max(Math.floor(increments), 1);
}

function scalePrepareToMaxMemory(ns: NS, summary: PrepareThreadSummary, maxMemory: number)
        : PrepareThreadSummary {
    const totalScriptMemory = summary.growth * ns.getScriptRam(MyScriptNames.Grow) 
        + summary.weaken * ns.getScriptRam(MyScriptNames.Weaken);

    if (totalScriptMemory > maxMemory) {
        const ratio = maxMemory / totalScriptMemory;
        return new PrepareThreadSummary(ratio * summary.growth, ratio * summary.weaken);
    }
    else {
        return summary;
    }
}