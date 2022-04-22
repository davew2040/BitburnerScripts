import { NS } from '@ns'
import { MyScriptNames } from '/globals';
import { HackThreadSummary } from '/hack-percentage-lib';
import { getUid } from '/unique-generator';


export function hack(ns: NS, source: string, target: string, threads: number): void {
    ns.exec(MyScriptNames.Hack, source, threads, target, getUid());
}

export function grow(ns: NS, source: string, target: string, threads: number): void {
    ns.exec(MyScriptNames.Grow, source, threads, target, getUid());
}

export function weaken(ns: NS, source: string, target: string, threads: number): void {
    ns.exec(MyScriptNames.Weaken, source, threads, target, getUid());
}

export function share(ns: NS, host: string, threads: number): void {
    ns.exec(MyScriptNames.Share, host, threads, getUid());
}

export function launchHackCycleSingle(ns: NS, processHost: string, 
        target: string, weakenThreads: number, growThreads: number,
        hackThreads: number, memory: number): void {
    ns.exec(MyScriptNames.HackByPercentageSingle, processHost, 1, processHost, target, weakenThreads, growThreads, hackThreads, memory, getUid());
}

export function launchHackCyclePart(ns: NS, source: string, 
        target: string, weakenThreads: number, growThreads: number,
        hackThreads: number, memory: number, isLastInSeries: boolean): void {
    ns.exec(MyScriptNames.HackByPercentagePart, source, 1, source, target, weakenThreads, growThreads, hackThreads, memory, isLastInSeries, getUid());
}

export function launchHackCycleSet(ns: NS, source: string, 
        target: string, threadsSummary: HackThreadSummary, memoryUsage: number): void {
    ns.exec(MyScriptNames.HackByPercentageSet, source, 1, source, target, 
        threadsSummary.weaken, threadsSummary.growth, threadsSummary.hack, 
        threadsSummary.repetitions, memoryUsage, getUid());
}

export function launchPrepare(ns: NS, source: string, target: string, memory: number): void {
    ns.exec(MyScriptNames.Prepare, source, 1, source, target, memory, getUid());
}