import { NS } from '@ns'
import { MyScriptNames } from '/globals';
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
    ns.exec(MyScriptNames.Share, host, threads);
}

export function launchHackCycle(ns: NS, processHost: string, subprocessHost: string, 
        target: string, weakenThreads: number, growThreads: number,
        hackThreads: number): void {
    ns.exec(MyScriptNames.HackByPercentage, processHost, 1, target, subprocessHost, weakenThreads, growThreads, hackThreads);
}

export function launchHackCycleSingle(ns: NS, source: string, 
        target: string, weakenThreads: number, growThreads: number,
        hackThreads: number): void {
    ns.exec(MyScriptNames.HackByPercentageSingle, source, 1, source, target, weakenThreads, growThreads, hackThreads, getUid());
}

export function launchHackCycleSet(ns: NS, processHost: string, subprocessHost: string, 
        target: string, weakenThreads: number, growThreads: number,
        hackThreads: number): void {
    ns.exec(MyScriptNames.HackByPercentageSet, processHost, 1, target, subprocessHost, weakenThreads, growThreads, hackThreads, getUid());
}