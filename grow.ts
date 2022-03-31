import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    const [targetHost] = ns.args;

    //ns.tprint(`STARTING GROW ON ${targetHost} money = ${ns.getServerMoneyAvailable(<string>targetHost)}`);
    await ns.grow(<string>targetHost);
    //ns.tprint(`COMPLETED GROW ON ${targetHost} money = ${ns.getServerMoneyAvailable(<string>targetHost)}`);
}