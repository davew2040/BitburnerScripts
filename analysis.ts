import { NS, ProcessInfo } from '@ns'
import { MyScriptNames } from '/globals';
import { serverStore } from '/server-store';
import { RunningProcessSummary } from '/targets-configuration';

export function printVictimsSummary(ns:NS, map: Map<string, RunningProcessSummary>): void {
    for (const key of map.keys()) {
        ns.tprint(`Victim ${key}`); 
        ns.tprint(`  grow = ${map.get(key)?.growThreads}`);
        ns.tprint(`  weaken = ${map.get(key)?.weakenThreads}`);
        ns.tprint(`  hack = ${map.get(key)?.hackThreads}`);
        ns.tprint(`  total = ${map.get(key)?.totalThreads}`);
    }
    ns.tprint(`Victim summary complete`);
}

export function getVictimsSummary(ns: NS): Map<string, RunningProcessSummary> {
    const map = new Map<string, RunningProcessSummary>();

    for (const sourceHost of serverStore.getSourceServers(ns)) {       
        const serverProcesses = ns.ps(sourceHost);

        for (const serverProcess of serverProcesses) {
            updateRunningProcessMap(ns, sourceHost, serverProcess, map);
        }
    }

    return map;
}

function updateRunningProcessMap(
    ns: NS, 
    sourceHost: string, 
    processInfo: ProcessInfo, 
    map: Map<string, RunningProcessSummary>)
    : void 
{
    const target = getScriptVictim(processInfo);

    const relevantProcs = [MyScriptNames.Grow, MyScriptNames.Weaken, MyScriptNames.Hack];

    if (relevantProcs.indexOf(processInfo.filename) === -1) {
        return;
    }

    if (!map.has(target)) {
        map.set(target, new RunningProcessSummary());
    }

    const summary = <RunningProcessSummary>map.get(target);

    if (processInfo.filename === MyScriptNames.Grow) {
        summary.growThreads += processInfo.threads;
    }
    else if (processInfo.filename === MyScriptNames.Weaken) {
        summary.weakenThreads += processInfo.threads;
    }
    else if (processInfo.filename === MyScriptNames.Hack) {
        summary.hackThreads += processInfo.threads;
    }
}


function getScriptVictim(processInfo: ProcessInfo): string {
    return processInfo.args[0];
}
