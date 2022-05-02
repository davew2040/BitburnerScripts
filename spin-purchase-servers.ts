import { NS } from '@ns'
import { ServerNames } from '/globals';
import { getPrivateServerName } from '/server-store';

const sleepMilliseconds = 5000;

export async function main(ns : NS) : Promise<void> {
    if (!ns.args[0]) {
        ns.tprint(`Usage: spin-purchase-servers <exponent> (purchase)`);
        return;
    }

    const memoryTarget = Math.pow(2, <number>ns.args[0]);
    const cost = ns.getPurchasedServerCost(memoryTarget);

    ns.tprint(`Purchasing servers with ${memoryTarget}GB of memory, cost $${ns.nFormat(cost, '0.00a')}...`);

    if (ns.args[1] !== "purchase") {
        return;
    }

    while (true) {
        if (ns.getPurchasedServers().length === ns.getPurchasedServerLimit()) {
            ns.tprint(`All server slots filled!`);
            break;
        }

        const newServerName = getServerName(ns);

        if (ns.getServerMoneyAvailable(ServerNames.Home) > cost) {
            ns.purchaseServer(newServerName, memoryTarget);
            await prepareHost(ns, newServerName);
        }

        await ns.sleep(sleepMilliseconds);
    }
}

async function prepareHost(ns: NS, hostName: string) {
	const copyFiles = ns.ls(ServerNames.Home).filter(f => f.endsWith(".js"));

	for (const copyFile of copyFiles) {	
		await ns.scp(copyFile, hostName);
	}
}

function getServerName(ns: NS): string {
    for (let i=1; i<=ns.getPurchasedServerLimit(); i++) {
        const testName = getPrivateServerName(i);
        if (ns.getPurchasedServers().indexOf(testName) === -1) {
            return testName;
        }
    }

    throw `Could not find valid purchased server name`;
}