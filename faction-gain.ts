import { NS } from '@ns'
import { MyScriptNames } from '/globals';
import { share } from '/process-launchers';
import { serverStore } from '/server-store';
import { getServerMemoryAvailable } from '/utilities';

const memoryConsumption = 0.2;

export async function main(ns : NS) : Promise<void> {
    for (const server of ns.getPurchasedServers()) {
        const procs = Math.floor(ns.getServerMaxRam(server)*memoryConsumption / ns.getScriptRam(MyScriptNames.Share));
        if (procs > 0) {
            share(ns, server, procs);
        }
    }
}
