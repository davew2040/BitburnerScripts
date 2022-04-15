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
        + ` hack level = ${ns.getServerRequiredHackingLevel(hostName)}`
        + ` ram = ${ns.getServerMaxRam(hostName)}`
        + ` grow factor = ${ns.getServerGrowth(hostName)}`
    );

    try {
        if (ns.fileExists("brutessh.exe")) {
            await ns.brutessh(hostName);
        }
        if (ns.fileExists("ftpcrack.exe")) {
            await ns.ftpcrack(hostName);
        }
        if (ns.fileExists("relaySMTP.exe")) {
            await ns.relaysmtp(hostName);
        }
        if (ns.fileExists("HTTPWorm.exe")) {
            await ns.httpworm(hostName);
        }
        if (ns.fileExists("SQLInject.exe")) {
            await ns.sqlinject(hostName);
        }
        
        await ns.nuke(hostName); 
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