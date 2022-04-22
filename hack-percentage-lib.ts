import { NS } from '@ns'
import { Costs, MyScriptNames } from '/globals';

const growWeakenBuffer = 1.1 // Add a small buffer to account for math not always adding up
const securityFocusProportion = 1.2;
export const starterOffsetTimeMilliseconds = 7500;
export const completionBufferTimeMilliseconds = 2500;

const incrementsCache = new Map<string, Array<number>>();

export class HackThreadSummary {
    constructor(
        public hack: number,
        public growth: number,
        public weaken: number,
        public percentage: number,
        public repetitions: number) {
    }

    public get totalThreads(): number {
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

export function getCurrentTotalThreadsForAttack(ns: NS, source: string, target: string, hackPercent: number): HackThreadSummary {
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

export function getIdealTotalThreadsForAttack(ns: NS, source: string, target: string, hackPercent: number): HackThreadSummary {
    if (hackPercent > .999 || hackPercent < 0.001) {
        throw "hackPercent must be between 0 and 1";
    }

    const toSteal = hackPercent * ns.getServerMaxMoney(target);

    const requiredHackThreads = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target, toSteal)));
    const requiredGrowthPercent = 1/(1-hackPercent);
    const requiredGrowthThreads = Math.ceil(growWeakenBuffer * ns.growthAnalyze(target, requiredGrowthPercent, ns.getServer(source).cpuCores));
    const securityDeficit = ns.growthAnalyzeSecurity(requiredGrowthThreads)
        + (ns.hackAnalyzeSecurity(requiredHackThreads));
    const requiredWeakenThreads = Math.ceil(growWeakenBuffer * (securityDeficit / Costs.weakenSecurityReductionPerThread));

    return new HackThreadSummary(
        Math.max(1, requiredHackThreads), 
        Math.max(1, requiredGrowthThreads), 
        Math.max(1, requiredWeakenThreads), 
        hackPercent,
        1);
}

export function getIdealTotalThreadsForAttackWithReps(ns: NS, source: string, target: string, hackPercent: number, reps: number): HackThreadSummary {
    const ideal = getIdealTotalThreadsForAttack(ns, source, target, hackPercent);
    ideal.repetitions = reps;
    return ideal;
}


export function getOptimalHackPercentageBinarySearch(ns: NS, source: string, target: string, maxPercent: number, memory: number, repetitions: number)
        : (HackThreadSummary | null) {
    if (maxPercent > 0.999) {
        throw `maxPercent must be <= 0.999`;
    }

    const incrementArray = getIncrementArray(0.001, maxPercent, 1000);

    const minValue = getIdealTotalThreadsForAttackWithReps(ns, source, target, incrementArray[0], repetitions);

    if (!attackFitsInMemory(ns, memory, minValue)) {
        return null;
    }

    const maxValue = getIdealTotalThreadsForAttackWithReps(ns, source, target, incrementArray[incrementArray.length-1], repetitions);

    if (attackFitsInMemory(ns, memory, maxValue)) {
        return maxValue;
    }

    let left = 0, right = incrementArray.length-1;

    while (left <= right) {
        const mid = Math.floor(left + (right-left)/2);

        const midValue = getIdealTotalThreadsForAttackWithReps(ns, source, target, incrementArray[mid], repetitions);
        const midPlusOneValue = getIdealTotalThreadsForAttackWithReps(ns, source, target, incrementArray[mid+1], repetitions);
        
        const midFits = attackFitsInMemory(ns, memory, midValue);
        const midPlusOneFits = attackFitsInMemory(ns, memory, midPlusOneValue);

        if (midFits && !midPlusOneFits) {
            return midValue;
        }
        else if (!midFits) {
            right = mid-1;
        }
        else {
            left = mid+1;
        }
    }

    return null;
}


function attackFitsInMemory(
    ns: NS, 
    memory: number, 
    threads: HackThreadSummary
): boolean {
    const attackMemory = threads.totalMemory(ns);

    return attackMemory < memory;
}


function getIncrementArray(min: number, max: number, incrementCount: number): Array<number> {
    const incrementArray: Array<number> = [];

    const key = `${min}:${max}:${incrementCount}`;

    if (incrementsCache.has(key)) {
        return <Array<number>>incrementsCache.get(key);
    }

    for (let currentIncrement = 0; currentIncrement <= incrementCount; currentIncrement++) {
        const next = min + (max-min) * (currentIncrement/incrementCount)
        incrementArray.push(next);
    }

    incrementsCache.set(key, incrementArray);

    return incrementArray;
}

export function getGrowThreadsForMemory(ns: NS, source: string, target: string, maxMemory: number): number {
    const idealThreads = getIdealGrowthThreads(ns, source, target);
    const maxMemoryThreads = Math.floor(maxMemory / ns.getScriptRam(MyScriptNames.Grow));

    return Math.min(idealThreads, maxMemoryThreads);
}

function getIdealGrowthThreads(ns: NS, source: string, target: string): number {
    const targetGrowthNeeded = ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target);
    return Math.ceil(ns.growthAnalyze(target, targetGrowthNeeded, ns.getServer(source).cpuCores));
}

export function getWeakenThreadsForMemory(ns: NS, source: string, target: string, maxMemory: number): number {
    const idealThreads = getIdealWeakenThreads(ns, target);
    const maxMemoryThreads = Math.floor(maxMemory / ns.getScriptRam(MyScriptNames.Weaken));

    return Math.min(idealThreads, maxMemoryThreads);
}

function getIdealWeakenThreads(ns: NS, target: string): number {
    const securityDeficit = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
    return Math.ceil(Math.max(securityDeficit / Costs.weakenSecurityReductionPerThread));
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

export function needsWeaken(ns: NS, target: string): boolean {
    return ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target) * 1.02;
}

export function needsGrow(ns: NS, target: string): boolean {
    return ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.98;
}