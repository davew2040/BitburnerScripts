import { CrimeStats, NS } from '@ns';
import { orderBy, orderByDescending } from '/utilities';

enum Crimes {
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
    Agility
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

const crimeLabelMap = new Map<Crimes, string>([
    [Crimes.Shoplift, CrimeLabels.Shoplift],
    [Crimes.RobStore, CrimeLabels.RobStore],
    [Crimes.MugSomeone, CrimeLabels.MugSomeone],
    [Crimes.Larceny, CrimeLabels.Larceny],
    [Crimes.DealDrugs, CrimeLabels.DealDrugs],
    [Crimes.BondForgery, CrimeLabels.BondForgery],
    [Crimes.TraffickIllegalArms, CrimeLabels.TraffickIllegalArms],
    [Crimes.Homicide, CrimeLabels.Homicide],
    [Crimes.GrandTheftAuto, CrimeLabels.GrandTheftAuto],
    [Crimes.KidnapAndRansom, CrimeLabels.KidnapAndRansom],
    [Crimes.Assassinate, CrimeLabels.Assassinate],
    [Crimes.Heist, CrimeLabels.Heist]
]);

const sleepTimeMilliseconds = 3000;  
const pollingIntervalMilliseconds = 300;
const maximizeType = MaximizeType.Karma;
 
export async function main(ns : NS) : Promise<void> {
    while (true) {
        const mostProfitable = findMostProfitableCrime(ns);
        await commitCrime(ns, <string>crimeLabelMap.get(mostProfitable));
        ns.tail();

        while (ns.isBusy()) {
            await ns.sleep(pollingIntervalMilliseconds);
        }
    }
}

function findMostProfitableCrime(ns: NS): Crimes {
    const crimes = enumCrimes();

    const crimesByRate = orderByDescending(crimes, c => getCrimeRate(ns, c));

    return crimesByRate[0];
}

function getCrimeRate(ns: NS, crime: Crimes): number {
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
        throw `Unrecognized maximize type ${maximizeType}`;
    }
}

async function commitCrime(ns: NS, crime: string): Promise<number> {
    const stats = ns.getCrimeStats(crime);
    ns.commitCrime(crime);
    return stats.time;
}

function enumCrimes(): Crimes[] {
    return Object.keys(Crimes).filter(key => !isNaN(<any>key)).map(c => Number.parseInt(c) as Crimes);
}