import { NS } from '@ns';
import { orderBy } from '/utilities';

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

enum Cycles {
    Training,
    Fighting
}

const checkTime = 60*1000;
let currentCycle = Cycles.Training;

export async function main(ns : NS) : Promise<void> {
    while (true) {
        if (ns.gang.canRecruitMember()) {
            ns.gang.recruitMember(getName(ns));
            ascendAndTrain(ns);
            await ns.sleep(checkTime);
            currentCycle = Cycles.Training;
        }
        else {
            if (currentCycle === Cycles.Training) {
                currentCycle = Cycles.Fighting;
                setFighting(ns);
                await ns.sleep(2*checkTime);
            }
            else{
                setTraining(ns);
                currentCycle = Cycles.Training;
                await ns.sleep(checkTime);
            }
        }
    }
}

function setFighting(ns: NS): void {
    const members = ns.gang.getMemberNames();

    let membersByStrength = orderBy(members, m => ns.gang.getMemberInformation(m).str);
    ns.gang.setMemberTask(membersByStrength[0], GangTasks.VigilanteJustice);
    membersByStrength = membersByStrength.slice(1);

    for (const member of membersByStrength) {
        ns.gang.setMemberTask(member, GangTasks.MugPeople);
    }
}

function setTraining(ns: NS): void {
    const members = ns.gang.getMemberNames();

    for (const member of members) {
        ns.gang.setMemberTask(member, GangTasks.TrainCombat);
    }
}

function ascendAndTrain(ns: NS): void {
    for (const member of ns.gang.getMemberNames()) {
        ns.gang.ascendMember(member);
        ns.gang.setMemberTask(member, GangTasks.TrainCombat);
    }
}

function getName(ns: NS): string {
    let i=1;

    while (true) {
        const name = `Johnny Numba ${i}`;
        if (ns.gang.getMemberNames().indexOf(name) === -1) {
            return name;
        }
        else {
            i++;
        }
    }
}