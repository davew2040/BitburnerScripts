import { MyScriptNames, ServerNames } from "/globals";

const homeScriptMemory = 0.8;
const otherServerScriptMemory = 0.9;

class DepthPair {
    value: string;
    parent: string;
    depth: number;

    constructor(value: string, parent: string, depth: number) {
        this.value = value;
        this.parent = parent;
        this.depth = depth;
    }
}

let id = 1;

export function GetUniqueNumber(): number {
    return id++;
}

export async function exploreServersAsync(
        ns: NS, scanDepth: 
        number, 
        visitor: (serverName: string, parentName: string, depth: number) => Promise<void>
): Promise<void> {
    const seen = new Set<string>();
    const queue = new Array<DepthPair>();

    queue.push(new DepthPair(ServerNames.Home, ServerNames.Home, 0));
    seen.add(ServerNames.Home);

    while (queue.length !== 0) {
        const current = <DepthPair>queue.shift();

        await visitor(<string>current.value, <string>current.parent, current.depth);

        const scans = ns.scan(current.value);
        
        for (const scan of scans) {
            if (!seen.has(scan) && current.depth + 1 <= scanDepth) {
                seen.add(scan);
                queue.push(new DepthPair(scan, <string>current.value, current.depth+1));
            }
        }
    }
}

export function exploreServers(
    ns: NS, scanDepth: 
    number, 
    visitor: (serverName: string, parentName: string, depth: number) => void
): void {
    const seen = new Set<string>();
    const queue = new Array<DepthPair>();

    queue.push(new DepthPair(ServerNames.Home, ServerNames.Home, 0));
    seen.add(ServerNames.Home);

    while (queue.length !== 0) {
        const current = <DepthPair>queue.shift();

        visitor(<string>current.value, <string>current.parent, current.depth);

        const scans = ns.scan(current.value);
        
        for (const scan of scans) {
            if (!seen.has(scan) && current.depth + 1 <= scanDepth) {
                seen.add(scan);
                queue.push(new DepthPair(scan, <string>current.value, current.depth+1));
            }
        }
    }
}

export function findPath(ns: NS, target: string): Array<string> {
    const map = new Map<string, string>();

    exploreServers(ns, 20, (server, parent) => {
        map.set(server, parent);
    });

    if (!map.has(target)) {
        return [];
    }

    const path: Array<string> = [];

    let current = target;

    while (true) {
        path.unshift(current);
        current = <string>map.get(current);
        if (current === map.get(current)) {
            path.unshift(current);
            break;
        }
    }

    return path;
}

export function formatNumber(someNumber: number): string {
    const trillion = 1000*1000*1000*1000;
    const billion = 1000*1000*1000;
    const million = 1000*1000;
    if (someNumber > trillion) {
        return `${(someNumber/trillion).toFixed(2)}t`;
    }
    else if (someNumber > billion) {
        return `${(someNumber/billion).toFixed(2)}b`;
    }
    else if (someNumber > million) {
        return `${(someNumber/million).toFixed(2)}m`;
    }
    else if (someNumber > 1000) {
        return `${(someNumber/1000).toFixed(2)}k`; 
    }
    else {
        return someNumber.toString();
    }
}

export function getServerMemoryAvailable(ns: NS, sourceName: string) : number {
    if (sourceName === ServerNames.Home) {
        return ns.getServerMaxRam(sourceName)*homeScriptMemory - ns.getServerUsedRam(sourceName);
    }
    else {
        return ns.getServerMaxRam(sourceName)*otherServerScriptMemory - ns.getServerUsedRam(sourceName)
    }
}

export function orderBy<T>(values: Array<T>, mapper: (value:T) => number): Array<T> {
    return [...values].sort((a, b) => mapper(a) - mapper(b));
}

export function orderByDescending<T>(values: Array<T>, mapper: (value:T) => number): Array<T> {
    return orderBy(values, val => -mapper(val));
}