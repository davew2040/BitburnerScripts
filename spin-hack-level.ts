import { NS } from '@ns'
import { Costs, MyScriptNames } from '/globals';
import { grow, weaken } from '/process-launchers';

let host = "pserv-25";
let target = "foodnstuff";
let memory = 40;

export async function main(ns : NS) : Promise<void> {
    if (ns.args.length < 3) {
        ns.tprint(`Usage: spin-hack-level <source> <target> <memory>`);
        return;
    }

    if (ns.args[0]) {
        host = <string>ns.args[0];
    }
    if (ns.args[1]) {
        target = <string>ns.args[1];
    }
    if (ns.args[2]) {
        memory = <number>ns.args[2];
    }

    if (memory < 1 || memory > 100) {
        ns.tprint("Memory should be between 1-100");
        return;
    }

    const growThreads = Math.floor((memory/100)*ns.getServerMaxRam(host) / ns.getScriptRam(MyScriptNames.Grow));
    const securityLoss = growThreads * Costs.growSecurityCostPerThread;
    const weakenThreads = securityLoss / Costs.weakenSecurityReductionPerThread;
    const weakenTime = ns.getWeakenTime(target);

    while (true) {
        grow(ns, host, target, growThreads);
        weaken(ns, host, target, weakenThreads);
        
        await ns.sleep(weakenTime + 1000);
    }
}

