import { NS } from '@ns';
import { exploitServer } from '/explore-lib';
import { exploreServersAsync, formatNumber } from '/utilities';


export async function main(ns : NS) : Promise<void> {
    const scanDepth = <number>ns.args[0];

    await exploreServersAsync(ns, scanDepth, (serverName, parent, depth) => visit(ns, serverName, parent));
} 

async function visit(ns: NS, hostName: string, parent: string) {
    try {
        await exploitServer(ns, hostName);
    }
    catch (e) {
        ns.print(`Error = ${e}`);
    }

    ns.tprint(`servername = ${hostName}, parent = ${parent},`
        + ` money = $${formatNumber(ns.getServerMoneyAvailable(hostName))}/$${formatNumber(ns.getServerMaxMoney(hostName))},`
        + ` security = ${ns.getServerSecurityLevel(hostName)} (min = ${ns.getServerMinSecurityLevel(hostName)})`
        + ` hack level = ${ns.getServerRequiredHackingLevel(hostName)}`
        + ` ram = ${ns.getServerMaxRam(hostName)}`
        + ` grow factor = ${ns.getServerGrowth(hostName)}`
    );
}