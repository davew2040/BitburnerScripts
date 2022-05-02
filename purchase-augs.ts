import { AugmentationStats, NS } from '@ns'
import { ServerNames } from '/globals';
import { orderByDescending, removeFromArray } from '/utilities'

const targetFactions: Array<string> = [
    'Aevum',
    'Tian Di Hui',
    'Slum Snakes'
];
const NeurofluxGovernor = "NeuroFlux Governor";

interface FactionAugPair {
    faction: string,
    aug: string
}

export async function main(ns : NS) : Promise<void> {
    purchaseAugs(ns, targetFactions);
}

function getFactions(ns: NS): Array<string> {
    return targetFactions;
}

function purchaseAugs(ns: NS, factions: Array<string>) : void {
    const ordered = orderedAugs(ns, factions);
    purchaseAugSet(ns, ordered);
}

function orderedAugs(ns: NS, factions: Array<string>): Array<FactionAugPair> {
    const all: Array<FactionAugPair> = [];

    for (const faction of factions) {
        for (const aug of ns.getAugmentationsFromFaction(faction)) {
            if (all.some(a => a.aug === aug)) {
                continue;
            }

            all.push({
                faction: faction,
                aug: aug
            });
        }
    }

    const filtered = filterAugs(ns, all)
    const ordered = orderByDescending(filtered, a => ns.getAugmentationPrice(a.aug));

    return ordered;
}

function filterAugs(ns: NS, augs: Array<FactionAugPair>): Array<FactionAugPair> {
    return augs.filter(a => a.aug !== NeurofluxGovernor && shouldInclude(ns, a.aug));
}

function shouldInclude(ns: NS, aug: string): boolean {
    return hasRelevantProperty(ns, aug, aug => aug.hacking_chance_mult) ||
        hasRelevantProperty(ns, aug, aug => aug.hacking_exp_mult) ||
        hasRelevantProperty(ns, aug, aug => aug.hacking_grow_mult) ||
        hasRelevantProperty(ns, aug, aug => aug.hacking_money_mult) ||
        hasRelevantProperty(ns, aug, aug => aug.hacking_mult) ||
        hasRelevantProperty(ns, aug, aug => aug.hacking_speed_mult);
}

function hasRelevantProperty(ns: NS, aug: string, getter: (fn: AugmentationStats) => (number | undefined)): boolean {
    const value = getter(ns.getAugmentationStats(aug));
    return !!value && <number>value > 1;
}

function purchaseAugSet(ns: NS, ordredAugs: Array<FactionAugPair>): void {
    while (ordredAugs.length > 0) {
        const mostExpensive = ordredAugs[0];
        const mostExpensiveCost = ns.getAugmentationPrice(mostExpensive.aug);

        if (ns.getServerMoneyAvailable(ServerNames.Home) > mostExpensiveCost) {
            ns.purchaseAugmentation(mostExpensive.faction, mostExpensive.aug);
        }

        ordredAugs = removeFromArray(ordredAugs, 0)[1];
    }
}

function purchaseAugsForFaction(ns: NS, faction: string): void {
    const purchasable = purchasableAugs(ns, faction);
    let ordered = orderByDescending(purchasable, a => ns.getAugmentationPrice(a));
    
    while (ordered.length > 0) {
        const mostExpensive = ns.getAugmentationPrice(ordered[0]);

        if (ns.getServerMoneyAvailable(ServerNames.Home) < mostExpensive) {
            break;
        }

        ns.purchaseAugmentation(faction, ordered[0]);

        ordered = removeFromArray(ordered, 0)[1];
    }
}

function purchasableAugs(ns: NS, faction: string): Array<string> {
    const augs = ns.getAugmentationsFromFaction(faction)
        .filter(a => ns.getAugmentationRepReq(a) < ns.getFactionRep(faction));
    return augs;
}