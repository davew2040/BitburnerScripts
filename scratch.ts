import { NS } from '@ns';
import { notStrictEqual } from 'assert';
import { nth } from 'lodash';
import { ServerNames } from '/globals';
import { getOptimalHackPercentageBinarySearch, sequentialServerGainRate } from '/hack-percentage-lib';
import { getPrivateServerName, serverStore } from '/server-store';
import { exploreServers, formatNumber, orderBy, orderByDescending, padLeft } from '/utilities';

export async function main(ns : NS) : Promise<void> {
    ns.tprint(ns.getAugmentationRepReq('Cranial Signal Processors - Gen II'));
}    

function getServers(ns: NS): Array<string> {
    const servers = serverStore.getPotentialTargets(ns);
    const ordered = orderBy(servers, s => ns.getServerMaxMoney(s));

    return ordered;
}