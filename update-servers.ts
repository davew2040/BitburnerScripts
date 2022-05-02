import { NS } from '@ns'
import { homedir } from 'os';
import { MyScriptNames, ServerNames } from '/globals';
import { getPrivateServerName } from '/server-store';
import { formatNumber, orderBy } from '/utilities';

let serverCount = 25;

export async function main(ns: NS) : Promise<void> {
    printServerStatus(ns);

    ns.tprint(`-----------------------`);

    if (ns.args.length < 2) {
        ns.tprint(getUsage());
        return;
    }
    
    const ramTarget = Math.pow(2, <number>ns.args[0]);
    serverCount = <number>ns.args[1];

    if (serverCount > ns.getPurchasedServerLimit()) {
        ns.tprint(`Can create at most ${ns.getPurchasedServerLimit()} servers.`);
        return;
    }
    const totalRequiredMoney = ns.getPurchasedServerCost(ramTarget)*serverCount;

    if (!ns.args[2] || (<string>ns.args[2]).toLowerCase() !== "update") {
        ns.tprint(`Cost to buy ${serverCount} servers with ${ramTarget}GB = $${formatNumber(totalRequiredMoney)}`);
        return;
    }

    try {
        ns.tprint(`Purchasing ${serverCount} servers for $${formatNumber(totalRequiredMoney)}...`);

        if (currentMoney(ns) < totalRequiredMoney) {
            ns.tprint(`Insufficient money, need ${totalRequiredMoney}.`);
            return;
        }

        const serversToKill = getServersToKill(ns, serverCount);
        deleteServers(ns, serversToKill);

        let serverIndex = 1;
        for (let i=0; i<serverCount; i++) {
            while (ns.serverExists(getPrivateServerName(serverIndex))) {
                serverIndex++;
            }

            ns.purchaseServer(getPrivateServerName(serverIndex), ramTarget);
            serverIndex++;
        }

        ns.exec(MyScriptNames.SetupHosts, ServerNames.Home, 1);
    }
    catch (e) {
        ns.tprint(`Error while purchasing servers: ${e}`);
    }
}

function getServersToKill(ns: NS, serverCount: number): Array<string> {
    const ordered = orderBy(ns.getPurchasedServers(), s => ns.getServer(s).maxRam);

    const freeSpots = ns.getPurchasedServerLimit() - ordered.length;

    let killCount = 0;
    if (serverCount > freeSpots) {
        killCount = serverCount - freeSpots;
    }

    const toKill: Array<string> = [];

    for (let i=0; i<killCount; i++) {
        toKill.push(ordered[i]);
    }
    
    return toKill;
}

function getUsage(): string {
    return `Usage: update-servers <ram_exponent> <number_of_servers> (update)`;
} 

function printServerStatus(ns: NS): void {
    for (const server of [ServerNames.Home, ...ns.getPurchasedServers()]) {
        const serverDetails = ns.getServer(server);
        ns.tprint(`Server ${server} has ${ns.nFormat(serverDetails.maxRam*1000*1000, '0.00b')} of RAM`);
    }
}

function deleteServers(ns: NS, serversToKill: Array<string>) {
    for (const server of serversToKill) {
        ns.killall(server);
        ns.deleteServer(server);
    }
}

function currentMoney(ns: NS) {
    return ns.getServerMoneyAvailable(ServerNames.Home);
}