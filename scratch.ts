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
    DealDrugs
}

class CrimeLabels {
    public static Shoplift = 'Shoplift';
    public static RobStore = 'Rob Store';
    public static MugSomeone = 'Mug Someone';
    public static Larceny = 'Larceny';
    public static DealDrugs = 'Deal Drugs';
} 

const crimeLabelMap = new Map<Crimes, string>([
    [Crimes.Shoplift, CrimeLabels.Shoplift],
    [Crimes.RobStore, CrimeLabels.RobStore],
    [Crimes.MugSomeone, CrimeLabels.MugSomeone],
    [Crimes.Larceny, CrimeLabels.Larceny],
    [Crimes.DealDrugs, CrimeLabels.DealDrugs]
]);

const allCrimes = [
    Crimes.Shoplift
]

const sleepTimeMilliseconds = 3000;
 
export async function main(ns : NS) : Promise<void> {
    while (true) {
        await commitCrime(ns, CrimeLabels.RobStore);
    }
}

function findMostProfitableCrime(ns: NS): Crimes {
    const crimes = enumCrimes();

    const crimesByRate = orderByDescending(crimes, c => getCrimeRate(ns, c));

    return crimesByRate[0];
}

function getCrimeRate(ns: NS, crime: Crimes): number {
    const stats = ns.getCrimeStats(<string>crimeLabelMap.get(crime));
    const chance = ns.getCrimeChance(<string>crimeLabelMap.get(crime));
    return chance * (stats.money / (stats.time + sleepTimeMilliseconds));
}

async function commitCrime(ns: NS, crime: string): Promise<void> {
    const stats = ns.getCrimeStats(crime);
    ns.commitCrime(crime);
    await ns.sleep(stats.time + sleepTimeMilliseconds);
}

function enumCrimes(): Crimes[] {
    return Object.keys(Crimes).filter(key => !isNaN(Number(Crimes[<any>key]))).map(c => <unknown>c as Crimes);
}