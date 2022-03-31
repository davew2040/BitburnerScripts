import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    const [targetHost] = ns.args;

    await ns.hack(<string>targetHost);
}