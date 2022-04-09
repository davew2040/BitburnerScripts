import { NS } from '@ns'
import { MyScriptNames, ServerNames } from '/globals';
import { getPrivateServerName } from '/server-store';
import { formatNumber } from '/utilities';

export async function main(ns : NS) : Promise<void> {
    if (!ns.args[0] || <number>ns.args[0] <= 0) {
        ns.tprint(`Requires parameter for RAM target`);
        return;
    }

    const ramTarget = Math.pow(2, <number>ns.args[0]);
    const totalRequiredMoney = ns.getPurchasedServerCost(ramTarget)*ns.getPurchasedServerLimit();

    if (!ns.args[1] || (<string>ns.args[1]).toLowerCase() !== "update") {
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

        ns.exec(MyScriptNames.SetupHosts, ServerNames.Home, 1);
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