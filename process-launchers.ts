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

export function launchHackCycle(ns: NS, processHost: string, subprocessHost: string, 
        target: string, weakenThreads: number, growThreads: number,
        hackThreads: number): void {
    ns.exec(MyScriptNames.HackByPercentage, processHost, 1, target, subprocessHost, weakenThreads, growThreads, hackThreads);
}

export function launchHackCycleSingle(ns: NS, source: string, 
        target: string, weakenThreads: number, growThreads: number,
        hackThreads: number, memory: number, isLastInSeries: boolean): void {
    ns.exec(MyScriptNames.HackByPercentageSingle, source, 1, source, target, weakenThreads, growThreads, hackThreads, memory, isLastInSeries, getUid());
}

export function launchHackCycleSet(ns: NS, processHost: string, subprocessHost: string, 
        target: string, threadsSummary: HackThreadSummary): void {
    ns.exec(MyScriptNames.HackByPercentageSet, processHost, 1, subprocessHost, target, 
        threadsSummary.weaken, threadsSummary.growth, threadsSummary.hack, 
        threadsSummary.repetitions, threadsSummary.totalMemory(ns), getUid());
}

export function launchPrepare(ns: NS, source: string, target: string, weakenThreads: number, growThreads: number, memory: number): void {
    ns.exec(MyScriptNames.Prepare, source, 1, source, target, weakenThreads, growThreads, memory, getUid());
}