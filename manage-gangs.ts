import { GangMemberAscension, NS } from '@ns';
import { arrayBuffer } from 'stream/consumers';
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

class GangEquipment {
    public static BaseballBat = "Baseball Bat";
}

enum Cycles {
    Training,
    Fighting
}

const strengthMinimum = 500;
const checkTime = 60*1000;
let currentCycle = Cycles.Training;

export async function main(ns : NS) : Promise<void> {
    const info = ns.gang.getGangInformation(); 

    while (true) {
        doRecruit(ns);
        doAscend(ns);

        if (currentCycle === Cycles.Training) {
            currentCycle = Cycles.Fighting;

            if (info.wantedLevel > 2) {
                setAllVigilante(ns);
            }
            else {
                setFighting(ns);
            }

            await ns.sleep(2*checkTime);
        }
        else{
            currentCycle = Cycles.Training;
            setTraining(ns);
            await ns.sleep(checkTime);
        }
    }
}

function setFighting(ns: NS): void {
    const members = ns.gang.getMemberNames();

    let membersByStrength = orderBy(members, m => ns.gang.getMemberInformation(m).str);
    ns.gang.setMemberTask(membersByStrength[0], GangTasks.VigilanteJustice);
    membersByStrength = membersByStrength.slice(1);

    for (const member of membersByStrength) {
        const memberInfo = ns.gang.getMemberInformation(member);
        if (memberInfo.str > strengthMinimum) {
            ns.gang.setMemberTask(member, GangTasks.TraffickIllegalArms);
        }
        else {
            ns.gang.setMemberTask(member, GangTasks.MugPeople);
        }
    }
}

function setAllVigilante(ns: NS): void {
    const members = ns.gang.getMemberNames();

    for (const member of members) {
        ns.gang.setMemberTask(member, GangTasks.VigilanteJustice);
    }
}


function setTraining(ns: NS): void {
    const members = ns.gang.getMemberNames();

    for (const member of members) {
        ns.gang.setMemberTask(member, GangTasks.TrainCombat);
    }
}


function doAscend(ns: NS): void {
    for (const member of ns.gang.getMemberNames()) {
        if (shouldAscend(ns, member)) {
            ns.gang.ascendMember(member);
            equipAfterAscension(ns, member);
        }
    }
}

function equipAfterAscension(ns: NS, member: string): void {
    const memberInfo = ns.gang.getMemberInformation(member);
    if (memberInfo.str_mult > 10) {
        ns.gang.purchaseEquipment(member, GangEquipment.BaseballBat);
    }
}

function shouldAscend(ns: NS, member: string): boolean {
    const current = ns.gang.getMemberInformation(member);
    const nextResult = ns.gang.getAscensionResult(member);

    if (!nextResult) {
        return false;
    }

    const next = <GangMemberAscension>nextResult;

    return (next.str / current.str_asc_mult) > 1.5;

}


function doRecruit(ns: NS): void {
    if (ns.gang.canRecruitMember()) {
        ns.gang.recruitMember(getName(ns));
    }
}

function removeFromArray<T>(array: Array<T>, index: number): [T, Array<T>] {
    const target = array[index];
    const newArray = array.splice(index);

    return [target, newArray];
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