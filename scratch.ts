import { NS } from '@ns';
import { serverStore } from '/server-store';

const target = "deltaone";

export async function main(ns : NS) : Promise<void> {
    for (const server of serverStore.getStolenServers(ns)) {
        ns.tprint(`killing all on ${server}`);
        ns.killall(server);
    }
}