import { NS } from '@ns'
import { ServerNames } from '/globals';
import { privateServerPrefix } from '/server-store';
import { exploreServers } from '/utilities';

const gatheringIntervalMilliseconds = 1*1000;
const logFile = "logs_timeData.log";

export async function main(ns : NS) : Promise<void> {
    while (true) {
        await collectData(ns);
        await ns.sleep(gatheringIntervalMilliseconds);
    }
}

async function collectData(ns:NS) {
    const collectedData = extractData(ns);
    if (!ns.fileExists(logFile)) {
        await ns.write(logFile, JSON.stringify(collectedData), "w");
    }
    else {
        await ns.write(logFile, ",\n" + JSON.stringify(collectedData), "a");
    }
}

function extractData(ns: NS): CollectionPoint {
    const nodeData = nodesToCollect(ns).map(name => extractNodeData(ns, name));
    
    return {
        dateTime: new Date(),
        nodeData: nodeData
    };
}

function extractNodeData(ns: NS, hostName: string): NodeData {
    const currentMoney = ns.getServerMoneyAvailable(hostName);
    const maxMoney = ns.getServerMaxMoney(hostName);
    const currentSecurity = ns.getServerSecurityLevel(hostName);
    const minSecurity = ns.getServerMinSecurityLevel(hostName);
    const hackLevel = ns.getServerRequiredHackingLevel(hostName);
    const growthRate = ns.getServerGrowth(hostName);

    return {
        hostName: hostName,
        currentMoney: currentMoney,
        maxMoney: maxMoney,
        currentSecurity: currentSecurity,
        minSecurity: minSecurity,
        hackLevel: hackLevel,
        growthRate: growthRate
    };
}

function nodesToCollect(ns: NS): Array<string> {
    const nodes = new Array<string>();
    exploreServers(ns, 10, serverName => nodes.push(serverName));

    return nodes.filter(n => n !== ServerNames.Home && !n.startsWith(privateServerPrefix));
}

interface NodeData {
    hostName: string;
    currentMoney: number;
    maxMoney: number;
    currentSecurity: number;
    minSecurity: number;
    hackLevel: number;
    growthRate: number;
}

interface CollectionPoint {
    dateTime: Date;
    nodeData: Array<NodeData>;
} 