import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    const targetHost = <string>ns.args[0];

    try {
        await ns.hack(<string>targetHost);
    }
    catch (e) {
        ns.tprint(ns, `Error encountered during hack: ${e}`);
    }
}