import { NS } from '@ns';
import { getPrivateServerName, serverStore } from '/server-store';
import { orderBy, orderByDescending } from '/utilities';

class GangTasks {
    public static Unassigned = 'Unassigned';
    public static MugPeople = 'Mug People';
    public static DealDrugs = 'Deal Drugs';
    public static StrongarmCivilians = 'Strongarm Civilians';
    public static RunACon = 'Run a Con';
    public static ArmedRobbery = 'Armed Robbery';
    public static TraffickIllegalArms = 'Traffick Illegal Arm';
    public static ThreatenBlackmail = 'Threaten & Blackmail';
    public static HumanTrafficking = 'Human Trafficking';
    public static Terrorism = 'Terrorism';
    public static VigilanteJustice = 'Vigilante Justice';
    public static TrainCombat = 'Train Combat';
    public static TrainHacking = 'Train Hacking';
    public static TrainCharisma = 'Train Charisma';
    public static TerritoryWarfare = 'Territory Warfare';
}

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
 
export async function main(ns : NS) : Promise<void> {
    while (true) {
        const mostProfitable = findMostProfitableCrime(ns);
        await commitCrime(ns, <string>crimeLabelMap.get(mostProfitable));
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
    return chance * (stats.money / (stats.time + sleepTimeMilliseconds));
}

async function commitCrime(ns: NS, crime: string): Promise<void> {
    const stats = ns.getCrimeStats(crime);
    ns.commitCrime(crime);
    await ns.sleep(stats.time + sleepTimeMilliseconds);
}

function enumCrimes(): Crimes[] {
    return Object.keys(Crimes).filter(key => !isNaN(<any>key)).map(c => Number.parseInt(c) as Crimes);
}