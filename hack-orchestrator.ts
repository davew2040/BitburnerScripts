import { NS, ProcessInfo } from '@ns'
import { MyScriptNames } from '/globals';
import { HackMessageQueue } from '/hack-message-queue';
import { getIdealHackRepetitions, getOptimalHackPercentageBinarySearch, needsGrow, needsWeaken } from '/hack-percentage-lib';
import { hackSetArgumentMemory, hackSetArgumentTarget } from '/hack-percentage-set';
import { hackSingleArgumentMemory, hackSingleArgumentTarget } from '/hack-percentage-single';
import { PortLogger, PortLoggerType } from '/port-logger';
import { prepareArgumentMemory, prepareArgumentTarget } from '/prepare';
import { launchHackCycleSet, launchHackCycleSingle, launchPrepare } from '/process-launchers';
import { serverStore } from '/server-store';
import { getMaxMemoryAvailable, orderBy, orderByDescending } from '/utilities';

const watcherCycleTime = 1000;
const defaultLogger = new PortLogger(PortLoggerType.LogDefault);

const targetBlacklist: Array<string> = [
    "foodnstuff",
    "fulcrumassets"
]

const targetWhitelist: Array<string> = [
//    ServerNames.Noodles,
//    ServerNames.HarakiriSushi,
//    ServerNames.JoesGuns,
//    ServerNames.HongFangTea
]

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
    maxConcurrent: number;
    maxServers: number;
}

const config: AttackConfiguration = {
    maxMemory: 900,
    maxPercentage: 0.9,
    maxConcurrent: 10,
    maxServers: 10
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
    await startMissingProcesses(ns, serverState);
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
            }
        }
        await startMissingProcesses(ns, serverState);
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

async function startMissingProcesses(ns: NS, serverState: ServerState): Promise<void> {
    const targets = orderBy(getCandidateTargets(ns), s => ns.getServerMaxMoney(s));

    for (const target of targets) {
        if (!serverState.hasTarget(target)) {
            await startAttack(ns, target, serverState, config);
        }
    }
}

async function startAttack(ns: NS, target: string, serverState: ServerState, config: AttackConfiguration): Promise<void> {
    if (serverNeedsPrepare(ns, target)) {
        startPrepare(ns, target, config.maxMemory, serverState);
    }
    else {
        await startHack(ns, target, serverState, config);
    }
}

async function startHack(ns: NS, target: string, serverState: ServerState, config: AttackConfiguration): Promise<boolean> {
    const source = getServerWithMemory(ns, config.maxMemory, serverState);
    if (!source) {
        return false;
    }

    const repetitions = getIdealHackRepetitions(ns, target, config.maxConcurrent);

    const optimal = getOptimalHackPercentageBinarySearch(ns, source, target, config.maxPercentage, config.maxMemory, repetitions);
    if (!optimal) {
        return false;
    }

    await defaultLogger.log(ns, `Starting hack cycle on target ${target} for ${optimal.percentage*100}% of funds`);
    
    let hackMemory = 0;

    if (repetitions > 1) {
        hackMemory = ns.getScriptRam(MyScriptNames.HackByPercentageSet)
            + ns.getScriptRam(MyScriptNames.HackByPercentagePart) * repetitions
            + optimal.totalMemory(ns);

        launchHackCycleSet(ns, source, target, optimal, hackMemory);
    }
    else {
        hackMemory = ns.getScriptRam(MyScriptNames.HackByPercentageSingle)
            + optimal.totalMemory(ns);

        launchHackCycleSingle(ns, source, target, optimal.weaken, optimal.growth, optimal.hack, hackMemory);
    }

    serverState.subtractMemory(ns, source, hackMemory);
    serverState.setTargetStatus(ns, 
        {
            source: source,
            target: target,
            status: AttackingStatus.Hack,
            memoryUsage: hackMemory
        });

    return true;
}

function startPrepare(ns: NS, target: string, maxMemory: number, serverState: ServerState): boolean {
    const source = getServerWithMemory(ns, maxMemory, serverState);
    if (!source) {
        return false;
    }

    launchPrepare(ns, source, target, maxMemory);

    serverState.subtractMemory(ns, source, maxMemory);
    serverState.setTargetStatus(ns, {
        target: target,
        source: source,
        status: AttackingStatus.Prepare,
        memoryUsage: maxMemory
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
    return needsGrow(ns, target) || needsWeaken(ns, target);
}

function getCandidateTargets(ns:NS): Array<string> {
    return serverStore.getPotentialTargets(ns).filter(server => isCandidateTarget(ns, server));
}

function isCandidateTarget(ns:NS, targetHost: string): boolean {
    let isCandidate = ns.getServerMoneyAvailable(targetHost) > 0
        && ns.getServerMaxMoney(targetHost) > 0
        && targetBlacklist.indexOf(targetHost) === -1
        && ns.getServerRequiredHackingLevel(targetHost) <= ns.getHackingLevel();
    
    if (targetWhitelist.length > 0) {
        isCandidate = isCandidate && targetWhitelist.indexOf(targetHost) !== -1;
    }

    return isCandidate;
}

function analyzeProcess(process: ProcessInfo, source: string): (TargetedAttackingStatus | null) {
    if (process.filename === MyScriptNames.HackByPercentageSet) {
        const result: TargetedAttackingStatus = {
            target: process.args[hackSetArgumentTarget],
            source: source,
            status: AttackingStatus.Hack,
            memoryUsage: Number.parseInt(process.args[hackSetArgumentMemory])
        }
        return result;
    }
    else if (process.filename === MyScriptNames.Prepare) {
        const result: TargetedAttackingStatus = {
            target: process.args[prepareArgumentTarget],
            source: source,
            status: AttackingStatus.Prepare,
            memoryUsage: Number.parseInt(process.args[prepareArgumentMemory])
        } 
        return result;
    }
    else if (process.filename === MyScriptNames.HackByPercentageSingle) {
        const result: TargetedAttackingStatus = {
            target: process.args[hackSingleArgumentTarget],
            source: source,
            status: AttackingStatus.Hack,
            memoryUsage: Number.parseInt(process.args[hackSingleArgumentMemory])
        } 
        return result;
    }
    return null;
}
