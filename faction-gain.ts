import { NS } from '@ns'
import { notStrictEqual } from 'assert';
import { MyScriptNames, ServerNames } from '/globals';
import { share } from '/process-launchers';

const memoryConsumption = 0.9;

export async function main(ns : NS) : Promise<void> {
    for (const server of getServers(ns)) {
        const procs = Math.floor(ns.getServerMaxRam(server)*memoryConsumption / ns.getScriptRam(MyScriptNames.Share));
        if (procs > 0) {
            share(ns, server, procs);
        }
    }
}

function getServers(ns: NS): Array<string> {
    //return ns.getPurchasedServers();
    return [
        "pserv-2",
    ];
}
