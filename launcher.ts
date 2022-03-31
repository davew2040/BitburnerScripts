import { NS, ProcessInfo } from '@ns'
import { serverStore } from './server-store.js';
import { MyScriptNames } from './globals.js';
import { GetUniqueNumber } from '/utilities.js';
import { 
    TargetsConfiguration, 
    SingleTargetConfiguration, 
    OperationProportions, 
    RunningProcessSummary 
} from '/targets-configuration.js';

const minimumMoneyThreshold = 0.75;
const minimumSecurityMultiplier = 1.25;
const rootTargetsConfig = new TargetsConfiguration();

initializeTargetsConfig(rootTargetsConfig);

export async function main(ns : NS) : Promise<void> {
    while (true) {
        try {
            updateRunningScripts(ns, rootTargetsConfig);
            await ns.sleep(5000);
        }
        catch (e) {
            ns.tprint(`Encountered exception ${e} while running scripts`);
        }
    }
}

function updateRunningScripts(ns: NS, targetsConfig: TargetsConfiguration) {
    const runningSummary = getVictimSummary(ns);

	for (const key of targetsConfig.map.keys()) {
        const targetConfig = targetsConfig.map.get(key);

        const currentTargetSummary = runningSummary.has(key) 
            ? <RunningProcessSummary>runningSummary.get(key) 
            : new RunningProcessSummary();

        if (serverNeedsWeakening(ns, key)) {
            //ns.tprint(`SERVER ${key} NEEDS WEAKENING`);
            fillWithWeaken(ns, key, currentTargetSummary, <OperationProportions>targetConfig?.proportions);
        }
        else if (serverNeedsGrowing(ns, key)) {
            //ns.tprint(`SERVER ${key} NEEDS GROWING`);
            fillWithGrow(ns, key, currentTargetSummary, <OperationProportions>targetConfig?.proportions);
        }
        else {
            //ns.tprint(`SERVER ${key} CAN FILL NORMALLY`);
            runMissingProcesses(
                ns, 
                key, 
                <RunningProcessSummary>currentTargetSummary, 
                <OperationProportions>targetConfig?.proportions);
        }
    }
}

function fillWithGrow(ns: NS, targetHost: string, summary: RunningProcessSummary, expectedProportions: OperationProportions): void {
    for (let i=0; i<expectedProportions.total - summary.total; i++) {
        runGrow(ns, targetHost);
    }
}

function fillWithWeaken(ns: NS, targetHost: string, summary: RunningProcessSummary, expectedProportions: OperationProportions): void {
    for (let i=0; i<expectedProportions.total - summary.total; i++) {
        runWeaken(ns, targetHost);
    }
}

function serverNeedsGrowing(ns: NS, targetHost: string): boolean {
    return ns.getServerMoneyAvailable(targetHost) < (ns.getServerMaxMoney(targetHost) * minimumMoneyThreshold);
}

function serverNeedsWeakening(ns: NS, targetHost: string): boolean {
    return ns.getServerSecurityLevel(targetHost) > ns.getServerMinSecurityLevel(targetHost) * minimumSecurityMultiplier;
}

function getSourceHost(ns: NS, scriptName: string): string | null {
    for (const serverName of serverStore.getSourceServers(ns)) {
        const availableMemory = getFreeServerMemory(ns, serverName);
        const scriptMemory = ns.getScriptRam(scriptName);   
        if (availableMemory > scriptMemory) {
            return serverName;
        }
    }

    return null;
}

function getSpreadSourceHosts(ns: NS, scriptName: string, nThreads: number): Map<string, number> {
    const map = new Map<string, number>();

    for (const serverName of serverStore.getSourceServers(ns)) {
        const availableMemory = getFreeServerMemory(ns, serverName);
        const scriptMemory = ns.getScriptRam(scriptName);

        const potentialThreads = Math.min(nThreads, Math.floor(availableMemory / scriptMemory));
        if (potentialThreads > 0) {
            map.set(serverName, potentialThreads); 
            nThreads -= potentialThreads;
        }
``
        if (nThreads === 0) {
            break;
        }
    }

    return map;
}

function getFreeServerMemory(ns: NS, hostname: string): number {
    return ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
}

function getVictimSummary(ns: NS): Map<string, RunningProcessSummary> {
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

    if (!map.has(target)) {
        map.set(target, new RunningProcessSummary());
    }

    const summary = <RunningProcessSummary>map.get(target);

    if (processInfo.filename === MyScriptNames.Grow) {
        summary.grow++;
    }
    else if (processInfo.filename === MyScriptNames.Weaken) {
        summary.weaken++;
    }
    else if (processInfo.filename === MyScriptNames.Hack) {
        summary.hack++;
    }
}

function getScriptVictim(processInfo: ProcessInfo): string {
    return processInfo.args[0];
}

function runMissingProcesses(
        ns: NS, 
        targetHost: string, 
        runningSummary: RunningProcessSummary, 
        expected: OperationProportions)
    : void 
{
    const neededGrows = expected.grow - runningSummary.grow;
    const neededWeakens = expected.weaken - runningSummary.weaken;
    const neededHacks = expected.hack - runningSummary.hack;

    for (let i=0; i<neededGrows; i++) {
        const result = runGrow(ns, targetHost);
        if (result === null) {
            return;
        }
    }

    for (let i=0; i<neededWeakens; i++) {
        const result = runWeaken(ns, targetHost);
        if (result === null) {
            return;
        }
    }

    for (let i=0; i<neededHacks; i++) {
        const result = runHack(ns, targetHost);
        if (result === null) {
            return;
        }
    }
}

function spreadProcess(NS: NS, script: string, target: string): void {

}

function runGrow(ns: NS, hostname: string): string | null  {
    return runUniqueScript(ns, hostname, MyScriptNames.Grow);
}

function runWeaken(ns: NS, hostname: string): string | null {
    return runUniqueScript(ns, hostname, MyScriptNames.Weaken);
}

function runHack(ns: NS, hostname: string): string | null {
    return runUniqueScript(ns, hostname, MyScriptNames.Hack);
}

function runUniqueScript(ns: NS, targetHost: string, script: string): string | null {
    const sourceHost = getSourceHost(ns, script);
    if (sourceHost === null) {
        return null;
    } 

    const uniqueId = GetUniqueNumber();

    //ns.tprint(`script = ${script}, sourceHost = ${sourceHost}, targetHost = ${targetHost}, uniqueId = ${uniqueId}`);
    ns.exec(script, sourceHost, 1, targetHost, uniqueId);

    return sourceHost;
}

function initializeTargetsConfig(config: TargetsConfiguration): void {
    config.add(
        "iron-gym", 
        new SingleTargetConfiguration(
            new OperationProportions(4, 20, 20),
            1
        )
    );
    config.add(
        "n00dles", 
        new SingleTargetConfiguration(
            new OperationProportions(2, 10, 10),
            1
        )
    );
    config.add(
        "sigma-cosmetics", 
        new SingleTargetConfiguration(
            new OperationProportions(4, 20, 20),
            1
        )
    );
    config.add(
        "zer0", 
        new SingleTargetConfiguration(
            new OperationProportions(4, 20, 20),
            1
        )
    );
}