import { NS, ProcessInfo } from '@ns'
import { Costs, MyScriptNames, ServerNames } from '/globals';
import { HackMessageQueue } from '/hack-message-queue';
import { getHackRepetitions, getPrepareSummary, getTotalThreadsForAttack, HackThreadSummary } from '/hack-percentage-lib';
import { launchHackCycleSet, launchPrepare } from '/process-launchers';
import { serverStore } from '/server-store';
import { getMaxMemoryAvailable, getServerMemoryAvailable, orderBy, orderByDescending } from '/utilities';

const watcherCycleTime = 1000;

interface TargetedAttackingStatus {
    target: string;
    source: string;
    status: AttackingStatus;
    memoryUsage: number;
}

enum AttackingStatus {
    Prepare,
    Hack
}

interface AttackConfiguration {
    maxMemory: number;
    maxPercentage: number;
}

const config: AttackConfiguration = {
    maxMemory: 15000,
    maxPercentage: 0.90
}

class ServerState {
    /**
     *  Tracks free memory allocated for this purpose; not ACTUAL free memory (does not consider
     *    other sources of memory use)
     */
    private freeMemoryMap = new Map<string, number>();
    private targetSummaryMap = new Map<string, TargetedAttackingStatus>();

    public setTargetStatus(ns: NS, status: TargetedAttackingStatus): void {
        if (this.targetSummaryMap.has(status.target)) {
            ns.tprint(`targetSummaryMap already has key ${status.target}!`);
            return;
        }
        else {
            this.targetSummaryMap.set(status.target, status);
        }
    }

    public hasTarget(target: string): boolean {
        return this.targetSummaryMap.has(target);
    }

    public clearTarget(target: string): void {
        this.targetSummaryMap.delete(target);
    }

    public getTargetStatus(ns: NS, target: string): TargetedAttackingStatus {
        if (!this.targetSummaryMap.has(target)) {
            throw `targetSummaryMap does not have key ${target}`;
        }

        return <TargetedAttackingStatus>this.targetSummaryMap.get(target);
    }

    public addFreeMemory(source: string, memory: number): void {
        if (!this.freeMemoryMap.has(source)) {
            this.freeMemoryMap.set(source, 0);
        }

        this.freeMemoryMap.set(source, memory + <number>this.freeMemoryMap.get(source));
    }

    public subtractMemory(ns: NS, source: string, memory: number): void {
        const freeMemory = this.getFreeMemory(ns, source);

        this.freeMemoryMap.set(source, freeMemory - memory);
    }

    public getFreeMemory(ns: NS, source: string): number {
        if (!this.freeMemoryMap.has(source)) {
            this.freeMemoryMap.set(source, getMaxMemoryAvailable(ns, source));
        }

        return <number>this.freeMemoryMap.get(source);
    }
}

export async function main(ns : NS) : Promise<void> {
    await start(ns);
}

async function start(ns: NS) {
    const queue = new HackMessageQueue();
    queue.clear(ns);
    
    const serverState = buildServerState(ns, config.maxMemory);
    startMissingProcesses(ns, serverState, config.maxMemory);
    await startWatcherLoop(ns, serverState);
}

async function startWatcherLoop(ns: NS, serverState: ServerState): Promise<void> {
    const queue = new HackMessageQueue();
    while (true) {
        while (!queue.empty(ns)) {
            const next = queue.dequeue(ns);
            if (serverState.hasTarget(next.target)) {
                const status = serverState.getTargetStatus(ns, next.target);
                
                serverState.addFreeMemory(next.source, status.memoryUsage);
                serverState.clearTarget(next.target);

                startAttack(ns, next.target, serverState, config);
            }
        }
        await ns.sleep(watcherCycleTime);
    }
}

function buildServerState(ns: NS, maxMemory: number): ServerState {
    const sourceServers = serverStore.getSourceServers(ns);
    const state = new ServerState();
    
    for (const sourceServer of sourceServers) {
        state.addFreeMemory(sourceServer, getMaxMemoryAvailable(ns, sourceServer));

        for (const process of ns.ps(sourceServer)) {
            const status = analyzeProcess(process, sourceServer);
            if (status && !state.hasTarget(status.target)) {
                state.setTargetStatus(ns, status);
                state.subtractMemory(ns, status.source, maxMemory); // this is not *really* accurate, it's just a placeholder
            }
        }
    }

    return state;
}

function startMissingProcesses(ns: NS, serverState: ServerState, maxMemory: number): void {
    const targets = orderByDescending(getCandidateTargets(ns), s => ns.getServerMaxMoney(s));
    
    for (const target of targets) {
        if (!serverState.hasTarget(target)) {
            startAttack(ns, target, serverState, config);
        }
    }
}

function startAttack(ns: NS, target: string, serverState: ServerState, config: AttackConfiguration): void {
    if (serverNeedsPrepare(ns, target)) {
        startPrepare(ns, target, config.maxMemory, serverState);
    }
    else {
        startHack(ns, target, serverState, config);
    }
}

function startHack(ns: NS, target: string, serverState: ServerState, config: AttackConfiguration): boolean {
    const source = getServerWithMemory(ns, config.maxMemory, serverState);
    if (!source) {
        return false;
    }
    const repetitions = getHackRepetitions(ns, target);
    const optimal = getOptimalHackPercentage(ns, source, target, config.maxPercentage, config.maxMemory, repetitions);
    if (!optimal) {
        return false;
    }
    
    launchHackCycleSet(ns, ServerNames.Home, source, target, optimal);

    serverState.subtractMemory(ns, source, optimal.totalMemory(ns));
    serverState.setTargetStatus(ns, 
        {
            source: source,
            target: target,
            status: AttackingStatus.Hack,
            memoryUsage: optimal.totalMemory(ns)
        });

    return true;
}

function startPrepare(ns: NS, target: string, maxMemory: number, serverState: ServerState): boolean {
    const source = 
    getServerWithMemory(ns, maxMemory, serverState);
    if (!source) {
        return false;
    }
    const prepareSummary = getPrepareSummary(ns, source, target, maxMemory);

    launchPrepare(ns, source, target, prepareSummary.weaken, prepareSummary.growth, prepareSummary.totalMemory(ns));

    serverState.subtractMemory(ns, source, prepareSummary.totalMemory(ns));
    serverState.setTargetStatus(ns, {
        target: target,
        source: source,
        status: AttackingStatus.Prepare,
        memoryUsage: prepareSummary.totalMemory(ns)
    });
    
    return true;
}

function getServerWithMemory(ns: NS, memory: number, serverState: ServerState): (string | null) {
    const servers = serverStore.getSourceServers(ns).filter(s => serverState.getFreeMemory(ns, s) > memory);
    const orderedServers = orderByDescending(servers, s => serverState.getFreeMemory(ns, s));
    
    if (orderedServers.length > 0) {
        return orderedServers[0];
    }
    
    return null;
}

function serverNeedsPrepare(ns: NS, target: string): boolean {
    return (ns.getServerMoneyAvailable(target) < 0.99 * ns.getServerMaxMoney(target) ||
        ns.getServerSecurityLevel(target) > 1.01*ns.getServerMinSecurityLevel(target));
}

function getCandidateTargets(ns:NS): Array<string> {
    return serverStore.getPotentialTargets(ns).filter(server => isCandidateTarget(ns, server));
}

function isCandidateTarget(ns:NS, targetHost: string): boolean {
    return ns.getServerMoneyAvailable(targetHost) > 0
        && ns.getServerMaxMoney(targetHost) > 0
        && ns.getServerRequiredHackingLevel(targetHost) <= ns.getHackingLevel();
}

function analyzeProcess(process: ProcessInfo, source: string): (TargetedAttackingStatus | null) {
    if (process.filename === MyScriptNames.HackByPercentageSet) {
        const result: TargetedAttackingStatus = {
            target: process.args[1],
            source: source,
            status: AttackingStatus.Hack,
            memoryUsage: Number.parseInt(process.args[6])
        }
        return result;
    }
    else if (process.filename === MyScriptNames.Prepare) {
        const result: TargetedAttackingStatus = {
            target: process.args[1],
            source: source,
            status: AttackingStatus.Prepare,
            memoryUsage: Number.parseInt(process.args[4])
        } 
        return result;
    }
    return null;
}

function getOptimalHackPercentage(ns: NS, source: string, target: string, maxPercent: number, memory: number, repetitions: number)
        : (HackThreadSummary | null) {
    if (maxPercent > 0.99) {
        throw `maxPercent must be <= 0.99`;
    }

    for (let i=maxPercent; i>0; i -= 0.01) {
        const threadsBreakdown = getTotalThreadsForAttack(ns, source, target, i);
        const usedMemory = threadsBreakdown.totalMemory(ns) * repetitions;

        if (usedMemory < memory) {
            threadsBreakdown.repetitions = repetitions;
            return threadsBreakdown;
        }
    }

    return null;
}
function operationMultiplier(ns: NS, sourceName: string, scriptName: string): number {
    if (sourceName === ServerNames.Home 
        && (scriptName === MyScriptNames.Grow || MyScriptNames.Weaken)) {
        return ns.getServer(ServerNames.Home).cpuCores;
    }

    return 1;
}