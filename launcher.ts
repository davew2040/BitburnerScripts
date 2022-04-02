import { NS, } from '@ns'
import { serverStore } from './server-store';
import { MyScriptNames, ServerNames } from './globals';
import { formatNumber, GetUniqueNumber } from '/utilities';
import { 
    TargetsConfiguration, 
    SingleTargetConfiguration, 
    OperationProportions, 
    RunningProcessSummary 
} from '/targets-configuration.js';
import { getVictimsSummary } from '/analysis';

const minimumMoneyThreshold = 0.6;
const minimumSecurityMultiplier = 1.5;
const delayTimeSeconds = 5;
const rootTargetsConfig = new TargetsConfiguration();

export async function main(ns : NS) : Promise<void> {
    initializeTargetsConfig(ns, rootTargetsConfig);

    ns.tprint(`Initialized targets, running...`);

    while (true) {
        try {
            updateRunningScripts(ns, rootTargetsConfig);
        
            await ns.sleep(delayTimeSeconds * 1000);
        }
        catch (e) {
            ns.tprint(`Encountered exception ${e} while running scripts`);
        }
    }
}

function updateRunningScripts(ns: NS, targetsConfig: TargetsConfiguration) {
    const runningSummary = getVictimsSummary(ns);
 
	for (const target of targetsConfig.map.keys()) {
        const targetConfig = targetsConfig.map.get(target);

        const currentTargetSummary = runningSummary.has(target) 
            ? <RunningProcessSummary>runningSummary.get(target) 
            : new RunningProcessSummary();

        if (serverNeedsWeakening(ns, target)) {
            //ns.tprint(`SERVER ${target} NEEDS WEAKENING`);
            fillWithWeaken(ns, target, currentTargetSummary, <OperationProportions>targetConfig?.proportions);
        }
        else if (serverNeedsGrowing(ns, target)) {
            //ns.tprint(`SERVER ${target} NEEDS GROWING`);
            fillWithGrow(ns, target, currentTargetSummary, <OperationProportions>targetConfig?.proportions);
        }
        else {
            //ns.tprint(`SERVER ${target} CAN FILL NORMALLY`);
            runMissingProcesses(
                ns, 
                target, 
                <RunningProcessSummary>currentTargetSummary, 
                <OperationProportions>targetConfig?.proportions);
        }
    }
}

function fillWithGrow(ns: NS, targetHost: string, summary: RunningProcessSummary, expectedProportions: OperationProportions): void {
    const count = expectedProportions.total - summary.totalThreads;
    if (count > 0) {
        runGrow(ns, targetHost, count);
    }
}

function fillWithWeaken(ns: NS, targetHost: string, summary: RunningProcessSummary, expectedProportions: OperationProportions): void {
    const count = expectedProportions.total - summary.totalThreads;
    if (count > 0) {
        runWeaken(ns, targetHost, expectedProportions.total - summary.totalThreads);
    }
}

function serverNeedsGrowing(ns: NS, targetHost: string): boolean {
    return ns.getServerMoneyAvailable(targetHost) < (ns.getServerMaxMoney(targetHost) * minimumMoneyThreshold);
}

function serverNeedsWeakening(ns: NS, targetHost: string): boolean {
    return ns.getServerSecurityLevel(targetHost) > ns.getServerMinSecurityLevel(targetHost) * minimumSecurityMultiplier;
}

// function getSourceHost(ns: NS, scriptName: string): string | null {
//     for (const serverName of serverStore.getSourceServers(ns)) {
//         const availableMemory = getFreeServerMemory(ns, serverName);
//         const scriptMemory = ns.getScriptRam(scriptName);   
//         if (availableMemory > scriptMemory) {
//             return serverName;
//         }
//     }

//     return null;
// }

function getSpreadSourceHosts(ns: NS, scriptName: string, nThreads: number): Map<string, number> {
    const map = new Map<string, number>();

    const nThreadTarget = nThreads;

    const sourceServers = serverStore.getSourceServers(ns);

    for (const serverName of sourceServers) {
        const availableMemory = getFreeServerMemory(ns, serverName);
        const scriptMemory = ns.getScriptRam(scriptName);

        const potentialThreads = Math.min(nThreads, Math.floor(availableMemory / scriptMemory));

        if (potentialThreads > 0) {
            map.set(serverName, potentialThreads); 
            nThreads -= potentialThreads;
        }

        if (nThreads === 0) {
            break;
        }
    }

    // if (map.size > 0) {
    //     ns.tprint(`Spreading ${scriptName} across ${nThreadTarget} results:`);
    //     for (const key of map.keys()) {
    //         ns.tprint(`  ${key} -> ${map.get(key)}`);
    //     }
    // }

    return map;
}

function getFreeServerMemory(ns: NS, hostname: string): number {
    return getEffectiveServerMemory(ns, hostname) - ns.getServerUsedRam(hostname);
}

function getEffectiveServerMemory(ns: NS, hostName: string) : number {
    if (hostName === ServerNames.Home) {
        return ns.getServerMaxRam(hostName) * 0.75;
    }
    else {
        return ns.getServerMaxRam(hostName);
    }
}

function runMissingProcesses(
        ns: NS, 
        targetHost: string, 
        runningSummary: RunningProcessSummary, 
        expected: OperationProportions)
    : void 
{
    const neededGrows = expected.grow - runningSummary.growThreads;
    const neededWeakens = expected.weaken - runningSummary.weakenThreads;
    const neededHacks = expected.hack - runningSummary.hackThreads;

    if (!runGrow(ns, targetHost, neededGrows)) {
        return;
    }

    if (!runWeaken(ns, targetHost, neededWeakens)) {
        return;
    }

    runHack(ns, targetHost, neededHacks);
}

function runGrow(ns: NS, hostname: string, nThreads: number): boolean  {
    return runUniqueScript(ns, hostname, MyScriptNames.Grow, nThreads);
}

function runWeaken(ns: NS, hostname: string, nThreads: number): boolean {
    return runUniqueScript(ns, hostname, MyScriptNames.Weaken, nThreads);
}

function runHack(ns: NS, hostname: string, nThreads: number): boolean {
    return runUniqueScript(ns, hostname, MyScriptNames.Hack, nThreads);
}

function runUniqueScript(ns: NS, targetHost: string, script: string, nThreads: number): boolean {
    if (nThreads === 0) {
        return true;
    }

    const hostMap = getSpreadSourceHosts(ns, script, nThreads);

    let threadStartedSum = 0;

    for (const key of hostMap.keys()) {
        const threads = <number>hostMap.get(key);
        const uniqueId = GetUniqueNumber();
        //ns.tprint(`Running script ${script} from source ${key} on target ${targetHost} over ${threads} threads`);
        ns.exec(script, key, threads, targetHost, uniqueId);
        threadStartedSum += threads;
    }

    return threadStartedSum === nThreads;
}

function initializeTargetsConfig(ns: NS, config: TargetsConfiguration): void {
    // 1:5:5 weaken:grow:hack seems pretty decent
    const standardProportions = new OperationProportions(
        400,  //weaken
        3000,  // grow
        2000); // hack

    const targets = [...serverStore.getPotentialTargets(ns)]
        .filter(server => isPotentialTarget(ns, server))
        .sort((a, b) => {
            const aMoney = ns.getServerMaxMoney(a);
            const bMoney = ns.getServerMaxMoney(b);

            return -(aMoney - bMoney);
        })
        .slice(0, 10);

    ns.tprint(`config targets = `, targets); 

    for (const target of targets) {
        ns.tprint(`TARGET ${target} = ${formatNumber(ns.getServerMoneyAvailable(target))}/${formatNumber(ns.getServerMaxMoney(target))}`);
        config.add(
            target, 
            new SingleTargetConfiguration(
                standardProportions,
                1
            )
        );
    }

    addCustomTargets(ns, config);
}

function isPotentialTarget(ns: NS, hostName: string): boolean {
    return ns.getServerMoneyAvailable(hostName) > 1 
        && ns.getServerMinSecurityLevel(hostName) < 30
        && ns.getServerRequiredHackingLevel(hostName)  < 370
        && ns.getServerSecurityLevel(hostName) < 70;
}

function addCustomTargets(ns: NS, config: TargetsConfiguration): void {
    // config.map.delete("the-hub");
    // config.map.delete("silver-helix");
    // config.map.delete("crush-fitness");

    // config.add(
    //     "the-hub", 
    //     new SingleTargetConfiguration(
    //         new OperationProportions(100, 100, 0),
    //         1
    //     )
    // );
    // config.add(
    //     "silver-helix", 
    //     new SingleTargetConfiguration(
    //         new OperationProportions(200, 50, 0),
    //         1
    //     )
    // );
    // config.add(
    //     "crush-fitness", 
    //     new SingleTargetConfiguration(
    //         new OperationProportions(300, 300, 0),
    //         1
    //     )
    // );
}