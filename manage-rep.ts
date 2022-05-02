import { NS } from '@ns'
import { notStrictEqual } from 'assert';
import { Factions, ServerNames, WorkTypes } from '/globals';

interface RepTarget {
    faction: string;
    target: number;
}

const sleepMilliseconds = 30000;

const repTargets: Array<RepTarget> = [
    {
        faction: Factions.TheBlackHand,
        target: 175000
    }
];

let currentFaction: (string | null) = null; 

export async function main(ns : NS) : Promise<void> {
    await manageRep(ns);
}

async function manageRep(ns: NS): Promise<void> {
    while (true) {
        ns.tail();

        const faction = getCurrentTarget(ns, repTargets);
        
        if (faction === null) {
            break;
        }
        else if (faction !== currentFaction) {
            currentFaction = faction;
            ns.workForFaction(faction, WorkTypes.HackingContracts);
        }

        await ns.sleep(sleepMilliseconds);
    }

    ns.exec("crime.js", ServerNames.Home);
}

function getCurrentTarget(ns: NS, repTargets: Array<RepTarget>): (string | null) {
    for (const repTarget of repTargets) {
        if (ns.getFactionRep(repTarget.faction) < repTarget.target) {
            return repTarget.faction;
        }
    }

    return null;
}