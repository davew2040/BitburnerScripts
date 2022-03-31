import { ServerNames } from "/globals";

class DepthPair {
    value: string;
    depth: number;

    constructor(value: string, depth: number) {
        this.value = value;
        this.depth = depth;
    }
}

let id = 1;

export function GetUniqueNumber(): number {
    return id++;
}

export async function exploreServers(
        ns: NS, scanDepth: 
        number, 
        visitor: (serverName: string) => Promise<void>
): Promise<void> {
    const seen = new Set<string>();
    const queue = new Array<DepthPair>();

    queue.push(new DepthPair(ServerNames.Home, 0));
    seen.add(ServerNames.Home);

    while (queue.length !== 0) {
        const current = <DepthPair>queue.shift();

        await visitor(<string>current.value);

        const scans = ns.scan(current.value);
        
        for (const scan of scans) {
            if (!seen.has(scan) && current.depth + 1 <= scanDepth) {
                seen.add(scan);
                queue.push(new DepthPair(scan, current.depth+1));
            }
        }
    }
}
