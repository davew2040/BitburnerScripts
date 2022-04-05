import { NS } from '@ns';
import { grow, weaken } from '/process-launchers';

const target = "phantasy";

export async function main(ns : NS) : Promise<void> {
    const threads = ns.growthAnalyze(target, 1.5);
    const startMoney = ns.getServerMoneyAvailable(target);

    weaken(ns, "home", target, 1000);
    return;

    ns.tprint(`start money = ${startMoney}`);

    ns.tprint(`threads = ${threads}`);
    ns.tprint(`threads = ${threads}`);

    grow(ns, ns.getPurchasedServers()[0], target, Math.ceil(threads/2));
    grow(ns, ns.getPurchasedServers()[1], target, Math.ceil(threads/2));

    await ns.sleep(ns.getGrowTime(target)+1000);

    const midMoney = ns.getServerMoneyAvailable(target);
    ns.tprint(`mid money = ${midMoney} increase = ${(midMoney/startMoney)}`);

    grow(ns, ns.getPurchasedServers()[0], target, Math.ceil(threads));

    await ns.sleep(ns.getGrowTime(target)+1000);

    const finalMoney = ns.getServerMoneyAvailable(target);
    ns.tprint(`final money = ${finalMoney} increase = ${(finalMoney/midMoney)}`);

    // ns.tprint(test);
    // ns.tprint(test2);

    // hack(ns, "home", target, ns)
    // grow(ns, "home", target, homeThreads);
    // grow(ns, ns.getPurchasedServers()[0], target, otherThreads);
}