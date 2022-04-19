import { GangMemberAscension, NS } from '@ns';
import { arrayBuffer } from 'stream/consumers';
import { intBetween, orderBy, orderByDescending } from '/utilities';

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
    public static Katana = "Katana";
}

enum Cycles {
    Training,
    Fighting
}

const checkTime = 60*1000;
const usefulStrengthMinimum = 200;
const maxWantedLevel = 40;
const territoryAllocation = 0.3;

let currentCycle = Cycles.Fighting;

export async function main(ns : NS) : Promise<void> {
    while (true) {
        const info = ns.gang.getGangInformation(); 

        doRecruit(ns);
        doAscend(ns);

        if (currentCycle === Cycles.Fighting) {
            if (info.wantedLevel > maxWantedLevel) {
                setAllVigilante(ns);
            }
            else {
                setFighting(ns);
            }

            await ns.sleep(2*checkTime);
            currentCycle = Cycles.Training;
        }
        else {
            setTraining(ns);
            await ns.sleep(checkTime);
            currentCycle = Cycles.Fighting;
        }
    }
}

function setFighting(ns: NS): void {
    const members = ns.gang.getMemberNames();

    let membersByStrength = orderByDescending(members, m => ns.gang.getMemberInformation(m).str);

    const vigilanteIndex = intBetween(0, 2);
    const vigilante = membersByStrength[vigilanteIndex];
    ns.gang.setMemberTask(vigilante, GangTasks.VigilanteJustice);

    membersByStrength = removeFromArray(membersByStrength, vigilanteIndex)[1];
    const usefulMembers = membersByStrength.filter(m => isUseful(ns, m));
    let territoryToAllocate = usefulMembers.length * territoryAllocation;

    for (const member of membersByStrength) {
        const memberInfo = ns.gang.getMemberInformation(member);
        
        if (memberInfo.str > usefulStrengthMinimum) {
            if (territoryToAllocate > 0) {
                ns.gang.setMemberTask(member, GangTasks.TerritoryWarfare);
                territoryToAllocate--;
            }
            else {   
                ns.gang.setMemberTask(member, GangTasks.DealDrugs);
            }
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

function isUseful(ns: NS, member: string): boolean {
    return ns.gang.getMemberInformation(member).str > usefulStrengthMinimum;
}

function equipAfterAscension(ns: NS, member: string): void {
    const memberInfo = ns.gang.getMemberInformation(member);
    if (memberInfo.str_mult > 20) {
        ns.gang.purchaseEquipment(member, GangEquipment.Katana);
    }
    else if (memberInfo.str_mult > 10) {
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
    const newArray = [...array.slice(0, index), ...array.slice(index+1, array.length)];

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