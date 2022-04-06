import { NS } from '@ns';
import { MyScriptNames } from '/globals';
import { grow, weaken } from '/process-launchers';

const target = "computek";

export async function main(ns : NS) : Promise<void> {
    for (let i=0; i<ns.hacknet.numNodes(); i++) {
        ns.tprint(ns.hacknet.getNodeStats(i));
    }
}