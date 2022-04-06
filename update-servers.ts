import { NS } from '@ns'
import { ServerNames } from '/globals';
import { getPrivateServerName } from '/server-store';
import { formatNumber } from '/utilities';

const ramTarget = Math.pow(2, 12); 

export async function main(ns : NS) : Promise<void> {
    const totalRequiredMoney = ns.getPurchasedServerCost(ramTarget)*ns.getPurchasedServerLimit();

    if (!ns.args[0] || (<string>ns.args[0]).toLowerCase() !== "update") {
        ns.tprint(`Cost to buy servers with ${ramTarget}GB = $${formatNumber(totalRequiredMoney)}`);
        return;
    }

    try {
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