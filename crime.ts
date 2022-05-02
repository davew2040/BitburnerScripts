import { CrimeStats, NS, Player } from '@ns';
import { Stats } from 'fs';
import { orderBy, orderByDescending } from '/utilities';

interface StatWithValue{
    stat: CombatStat;
    value: number;
}

enum Crime {
    Shoplift,
    RobStore,
    MugSomeone,
    Larceny,
    DealDrugs,
    BondForgery,
    TraffickIllegalArms,
    Homicide,
    GrandTheftAuto,
    KidnapAndRansom,
    Assassinate,
    Heist
}

enum MaximizeType {
    Money,
    Karma,
    Strength,
    Dexterity,
    Defense,
    Agility,
    CombatStats
}

enum CombatStat {
    Strength,
    Agility,
    Dexterity,
    Defense,
}

class CrimeLabels {
    public static Shoplift = 'Shoplift';
    public static RobStore = 'Rob Store';
    public static MugSomeone = 'Mug Someone';
    public static Larceny = 'Larceny';
    public static DealDrugs = 'Deal Drugs';
    public static BondForgery = 'Bond Forgery';
    public static TraffickIllegalArms = 'traffick illegal arms';
    public static Homicide = 'Homicide';
    public static GrandTheftAuto = 'grand theft auto';
    public static KidnapAndRansom = 'kidnap and random';
    public static Assassinate = 'Assassinate';
    public static Heist = 'Heist';
} 

const crimeLabelMap = new Map<Crime, string>([
    [Crime.Shoplift, CrimeLabels.Shoplift],
    [Crime.RobStore, CrimeLabels.RobStore],
    [Crime.MugSomeone, CrimeLabels.MugSomeone],
    [Crime.Larceny, CrimeLabels.Larceny],
    [Crime.DealDrugs, CrimeLabels.DealDrugs],
    [Crime.BondForgery, CrimeLabels.BondForgery],
    [Crime.TraffickIllegalArms, CrimeLabels.TraffickIllegalArms],
    [Crime.Homicide, CrimeLabels.Homicide],
    [Crime.GrandTheftAuto, CrimeLabels.GrandTheftAuto],
    [Crime.KidnapAndRansom, CrimeLabels.KidnapAndRansom],
    [Crime.Assassinate, CrimeLabels.Assassinate],
    [Crime.Heist, CrimeLabels.Heist]
]);

const AllCombatStats = [
    CombatStat.Strength, 
    CombatStat.Agility, 
    CombatStat.Defense, 
    CombatStat.Dexterity
];

const sleepTimeMilliseconds = 3000;  
const pollingIntervalMilliseconds = 300;
const selectedMaximizeType = MaximizeType.CombatStats;
 
export async function main(ns : NS) : Promise<void> {
    while (true) {
        const mostProfitable = findMostProfitableCrime(ns, selectedMaximizeType);
        await commitCrime(ns, <string>crimeLabelMap.get(mostProfitable));
        ns.tail();

        while (ns.isBusy()) {
            await ns.sleep(pollingIntervalMilliseconds);
        }
    }
}

function findMostProfitableCrime(ns: NS, maximizeType: MaximizeType): Crime {
    const crimes = enumCrimes();

    let crimesByRate: Array<Crime> = [];

    if (maximizeType === MaximizeType.CombatStats) {
        const targetStat = getLowestCombatStat(ns);
        const maxType = mapCombatStatToMaxType(targetStat);
        crimesByRate = orderByDescending(crimes, c => getCrimeRate(ns, c, maxType));
    }
    else {
        crimesByRate = orderByDescending(crimes, c => getCrimeRate(ns, c, maximizeType));
    }

    return crimesByRate[0];
}

function mapCombatStatToMaxType(from: CombatStat): MaximizeType {
    if (from === CombatStat.Strength) {
        return MaximizeType.Strength;
    }
    else if (from === CombatStat.Dexterity) {
        return MaximizeType.Dexterity;
    }
    else if (from === CombatStat.Defense) {
        return MaximizeType.Defense;
    }
    else if (from === CombatStat.Agility) {
        return MaximizeType.Agility;
    }
    else {
        throw `Unrecognized type ${from}`;
    }
}

function getLowestCombatStat(ns: NS): CombatStat {
    const values: Array<StatWithValue> = [];

    const playerStats = ns.getPlayer();

    for (const key of AllCombatStats) {
        values.push({
            stat: key,
            value: getCombatStatValue(playerStats, key)
        });
    }

    const ordered = orderBy(values, v => v.value);

    return ordered[0].stat;
}

function getCombatStatValue(player: Player, stat: CombatStat): number {
    if (stat === CombatStat.Strength) {
        return player.strength;
    }
    else if (stat === CombatStat.Agility) {
        return player.agility;
    }
    else if (stat === CombatStat.Defense) {
        return player.defense;
    }
    else if (stat === CombatStat.Dexterity) {
        return player.dexterity;
    }
    else {
        throw `Unrecognized stat type ${stat}`;
    }
}

function getCrimeRate(ns: NS, crime: Crime, maximizeType: MaximizeType): number {
    const crimeLabel = <string>crimeLabelMap.get(crime);
    const stats = ns.getCrimeStats(crimeLabel);
    const chance = ns.getCrimeChance(crimeLabel);

    return chance * (getRateValueByType(stats, maximizeType) / (stats.time + pollingIntervalMilliseconds));
}

function getRateValueByType(stats: CrimeStats, type: MaximizeType): number {
    if (type === MaximizeType.Karma) {
        return stats.karma;
    }
    else if (type === MaximizeType.Money) {
        return stats.money;
    }
    else if (type === MaximizeType.Agility) {
        return stats.agility_exp;
    }
    else if (type === MaximizeType.Strength) {
        return stats.strength_exp;
    }
    else if (type === MaximizeType.Defense) {
        return stats.defense_exp;
    }
    else if (type === MaximizeType.Dexterity) {
        return stats.dexterity_exp;
    }
    else {
        throw `Unrecognized maximize type ${selectedMaximizeType}`;
    }
}

async function commitCrime(ns: NS, crime: string): Promise<number> {
    const stats = ns.getCrimeStats(crime);
    ns.commitCrime(crime);
    return stats.time;
}

function enumCrimes(): Crime[] {
    return Object.keys(Crime).filter(key => !isNaN(<any>key)).map(c => Number.parseInt(c) as Crime);
}