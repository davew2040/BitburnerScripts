import { NS } from '@ns'
import { MyScriptNames } from '/globals';


export function hack(ns: NS, source: string, target: string, threads: number): void {
    ns.exec(MyScriptNames.Hack, source, threads, target);
}

export function grow(ns: NS, source: string, target: string, threads: number): void {
    ns.exec(MyScriptNames.Grow, source, threads, target);
}

export function weaken(ns: NS, source: string, target: string, threads: number): void {
    ns.exec(MyScriptNames.Weaken, source, threads, target);
}

export function launchHackCycle(ns: NS, processHost: string, subprocessHost: string, 
        target: string, weakenThreads: number, growThreads: number,
        hackThreads: number): void {
    ns.exec(MyScriptNames.HackByPercentage, processHost, 1, target, subprocessHost, weakenThreads, growThreads, hackThreads);
}