import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    const [targetHost] = ns.args;

    //ns.tprint(`STARTING WEAKEN ON ${targetHost} security = ${ns.getServerSecurityLevel(<string>targetHost)}`);
    await ns.weaken(<string>targetHost);
    //ns.tprint(`COMPLETED WEAKEN ON ${targetHost} security = ${ns.getServerSecurityLevel(<string>targetHost)}`);
}