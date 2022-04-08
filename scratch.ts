import { NS } from '@ns';
import { grow, launchHackCycleSet, weaken } from '/process-launchers';
import { getTotalThreadsForAttack } from '/utilities';

const target = "deltaone";

export async function main(ns : NS) : Promise<void> {
    const threadSummary = getTotalThreadsForAttack(ns, "pserv-1", target, .90);
    const servers: Array<string> = [];
    //grow(ns, "home", "phantasy", 1000);
    //weaken(ns, "home", target, 10000);
    launchHackCycleSet(ns, "home", "pserv-1", "deltaone", threadSummary.weaken, threadSummary.growth, threadSummary.hack);
}