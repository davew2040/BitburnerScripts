import { NS } from '@ns'
import { ServerNames } from '/globals';
import { getPrivateServerName } from '/server-store';

const ramTarget = 2048; //GB

export async function main(ns : NS) : Promise<void> {
    try {
        const totalRequiredMoney = ns.getPurchasedServerCost(ramTarget)*ns.getPurchasedServerLimit();
        
        ns.tprint(`Purchasing servers for ${totalRequiredMoney}`);

        if (currentMoney(ns) < totalRequiredMoney) {
            ns.tprint(`Insufficient money, need ${totalRequiredMoney}.`);
            return;
        }

        deleteAllServers(ns);

        for (let i=1; i<=ns.getPurchasedServerLimit(); i++) {
            ns.purchaseServer(getPrivateServerName(i), ramTarget);
        }
    }
    catch (e) {
        ns.tprint(`Error while purchasing servers: ${e}`);
    }
}

function deleteAllServers(ns: NS) {
    for (const server of ns.getPurchasedServers()) {
        ns.killall(server);
        ns.deleteServer(server);
    }
}

function currentMoney(ns: NS) {
    return ns.getServerMoneyAvailable(ServerNames.Home);
}