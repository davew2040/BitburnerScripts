import { NS } from '@ns';
import { notStrictEqual } from 'assert';
import { nth } from 'lodash';
import { ServerNames } from '/globals';
import { getOptimalHackPercentageBinarySearch, sequentialServerGainRate } from '/hack-percentage-lib';
import { getPrivateServerName, serverStore } from '/server-store';
import { exploreServers, formatNumber, orderBy, orderByDescending, padLeft } from '/utilities';

export async function main(ns : NS) : Promise<void> {
    const maxMemoryPerHack = 50000;

    for (const server of getServers(ns)) {
        const optimalPercentage = getOptimalHackPercentageBinarySearch(ns, ServerNames.Home, server, .99, maxMemoryPerHack, 1);
        if (optimalPercentage) {
            const percentage = optimalPercentage.percentage;
            ns.tprint(`Rate of gain for ${server.padStart(20, ' ')} for ${(percentage*100).toFixed(2).padStart(7, ' ')}%`
                + ` = ${sequentialServerGainRate(ns, percentage, server, 3000).toFixed(0).padStart(10, ' ')}`);
        }
    }
}    

function getServers(ns: NS): Array<string> {
    const servers = serverStore.getPotentialTargets(ns);
    const ordered = orderBy(servers, s => ns.getServerMaxMoney(s));

    return ordered;
}