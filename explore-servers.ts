import { NS } from '@ns'


class DepthPair {
    value: string;
    depth: number;

    constructor(value: string, depth: number) {
        this.value = value;
        this.depth = depth;
    }
}

export async function main(ns : NS) : Promise<void> {
    const scanDepth = <number>ns.args[0];
    await explore(ns, "home", scanDepth);
}

async function explore(ns: NS, hostName: string, scanDepth: number) {
    const seen = new Set<string>();
    const queue = new Array<DepthPair>();

    queue.push(new DepthPair(hostName, 0));
    seen.add(hostName);

    while (queue.length !== 0) {
        const current = <DepthPair>queue.shift();

        await visit(ns, <string>current.value);

        const scans = ns.scan(current.value);
        
        for (const scan of scans) {
            if (!seen.has(scan) && current.depth + 1 <= scanDepth) {
                seen.add(scan);
                queue.push(new DepthPair(scan, current.depth+1));
            }
        }
    }
}

async function visit(ns: NS, hostName: string) {
    ns.tprint(`servername = ${hostName}, money = ${ns.getServerMoneyAvailable(hostName)}/${ns.getServerMaxMoney(hostName)}, `);

    try {
        await ns.brutessh(hostName);
        await ns.ftpcrack(hostName);
        await ns.nuke(hostName); 
    }
    catch (e) {
        ns.tprint(`ERROR = ${e}`);
    }
}