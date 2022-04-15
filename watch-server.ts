import { NS } from '@ns'
import { max } from 'lodash';

const cycleTimeMilliseconds = 10000;

export async function main(ns : NS) : Promise<void> {
    
    if (ns.args.length !== 1) {
        ns.tprint("Usage: watch-server <server_name>");
        return;
    }

    const server = <string>ns.args[0];

    while (true) {
        printServerDetails(ns, server);
        await ns.sleep(cycleTimeMilliseconds);
    }
}

function printServerDetails(ns: NS, server: string): void {
    const currentMoney = ns.getServerMoneyAvailable(server);
    const maxMoney = ns.getServerMaxMoney(server);

    ns.tprint(`Server ${server}`);
    ns.tprint(`  Money = $${currentMoney} / $${maxMoney} (${((currentMoney/maxMoney)*100).toFixed(2)}%)`);
    ns.tprint(`  Security = ${ns.getServerSecurityLevel(server)} / ${ns.getServerMinSecurityLevel(server)}`);
}