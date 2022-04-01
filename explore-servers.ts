import { NS } from '@ns';
import { exploreServersAsync, formatNumber } from '/utilities';


export async function main(ns : NS) : Promise<void> {
    const scanDepth = <number>ns.args[0];

    await exploreServersAsync(ns, scanDepth, (serverName, parent, depth) => visit(ns, serverName, parent));
} 

async function visit(ns: NS, hostName: string, parent: string) {
    ns.tprint(`servername = ${hostName}, parent = ${parent},`
        + ` money = $${formatNumber(ns.getServerMoneyAvailable(hostName))}/$${formatNumber(ns.getServerMaxMoney(hostName))},`
        + ` security = ${ns.getServerSecurityLevel(hostName)} (min = ${ns.getServerMinSecurityLevel(hostName)})`
        + ` hack level = ${ns.getServerRequiredHackingLevel(hostName)}`);


    try {
        await ns.brutessh(hostName);
        await ns.ftpcrack(hostName);
        await ns.relaysmtp(hostName);
        if (ns.getServerNumPortsRequired(hostName) <= 3) {
            await ns.nuke(hostName); 
        }
    }
    catch (e) {
        ns.tprint(`ERROR = ${e}`); 
    }
}

async function getRooted(ns: NS, hostName: string, rooted: Array<string>) {
    if (ns.hasRootAccess(hostName)) {
        rooted.push(hostName);
    }
}