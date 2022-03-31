import { NS } from '@ns';
import { exploreServers } from '/utilities';


export async function main(ns : NS) : Promise<void> {
    const scanDepth = <number>ns.args[0];
    await exploreServers(ns, scanDepth, (serverName) => visit(ns, serverName));
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