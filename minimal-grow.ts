import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    const targetHost = <string>ns.args[0];

    try {
        await ns.grow(<string>targetHost);
    }
    catch (e) {
        ns.tprint(ns, `Error encountered during grow: ${e}`);
    }
}