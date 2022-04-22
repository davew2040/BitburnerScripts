import { GangMemberAscension, NS } from '@ns';
import { notStrictEqual } from 'assert';
import { ServerNames } from '/globals';
import { average, basicSumHasher, intBetween as randomIntBetween, orderBy, orderByDescending, shuffle } from '/utilities';

class GangTasks {
    public static Unassigned = 'Unassigned';
    public static MugPeople = 'Mug People';
    public static DealDrugs = 'Deal Drugs';
    public static StrongarmCivilians = 'Strongarm Civilians';
    public static RunACon = 'Run a Con';
    public static ArmedRobbery = 'Armed Robbery';
    public static TraffickIllegalArms = 'Traffick Illegal Arms';
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
    public static Glock = "Glock 18C";
    public static BaseballBat = "Baseball Bat";
    public static Katana = "Katana";
}

enum Cycles {
    Training,
    Fighting
}

const cycleTimeMilliseconds = 60*1000;
const usefulStrengthMinimum = 200;
const maxAcceptableWantedLevel = 40;
const territoryAllocation = 0.3;
const minimumAscendFactor = 1.5;
const minimumAscendFactorAfterRecruit = 1.15;
const ascendLimiter = 15;
const usefulPercentage = 0.75;

let lastAscendCycle = -1000;
let currentCycle = Cycles.Fighting;
let cycleCount = 0;

export async function main(ns : NS) : Promise<void> {
    await startFightAndTrainLoop(ns);
}



const ascensionCutoffTable = new Map<number, number>([
    [0, 1.22],
    [1, 1.50],
    [2, 1.53],
    [3, 1.20],
    [4, 1.20],
    [5, 1.64],
    [6, 1.32],
    [7, 1.37],
    [8, 1.57],
    [9, 1.21],
]);

async function startFightAndTrainLoop(ns: NS): Promise<void> {
    while (true) {
        const info = ns.gang.getGangInformation(); 

        doRecruit(ns);
        doAscend(ns, minimumAscendFactor);

        if (currentCycle === Cycles.Fighting) {
            if (info.wantedLevel > maxAcceptableWantedLevel) {
                setAllVigilante(ns);
            }
            else {
                setFighting(ns);
            }

            await ns.sleep(2*cycleTimeMilliseconds);
            currentCycle = Cycles.Training;
        }
        else {
            setTraining(ns);
            await ns.sleep(cycleTimeMilliseconds);
            currentCycle = Cycles.Fighting;
        }

        cycleCount++;
    }
}

async function startTrainingOnlyLoop(ns: NS): Promise<void> {
    for (const member of ns.gang.getMemberNames()) {
        ns.gang.setMemberTask(member, GangTasks.TrainCombat);
    }

    while (true) {
        for (const member of ns.gang.getMemberNames()) {
            if (!ns.gang.getAscensionResult(member)) {
                continue;
            }

            if ((<GangMemberAscension>ns.gang.getAscensionResult(member)).str > 1.15) {
                ns.gang.ascendMember(member);
            }
        }

        await ns.sleep(cycleTimeMilliseconds);
    }
}

function setFighting(ns: NS): void {
    setClash(ns);

    const members = ns.gang.getMemberNames();

    const useful = members.filter(m => isUseful(ns, m));
    const notUseful = members.filter(m => !isUseful(ns, m));

    allocateUsefulMembers(ns, useful);

    notUseful.forEach(m => ns.gang.setMemberTask(m, GangTasks.TrainCombat));
}

function setClash(ns: NS): void {
    ns.gang.setTerritoryWarfare(shouldClash(ns));
}

function shouldClash(ns: NS): boolean {
    const currentGang = ns.gang.getGangInformation().faction;
    const gangs = Object.keys(ns.gang.getOtherGangInformation())
        .filter(g => g !== currentGang);

    const averageWinChance = average(gangs, g => ns.gang.getChanceToWinClash(g));

    return averageWinChance > 0.8;
}

function allocateTerritory(ns: NS, pool: Array<string>): Array<string> {
    const toAllocate = 0; //(pool.length - 4) * 0.3;

    for (let i=1; i<=toAllocate; i++) {
        const remove = removeRandomFromArray(pool);

        const target = remove[0];
        pool = remove[1];

        ns.gang.setMemberTask(target, GangTasks.TerritoryWarfare);
    }
   
    return pool;
}


function allocateUsefulMembers(ns: NS, pool: Array<string>): Array<string> {
    pool = allocateTerritory(ns, pool);

    shuffle(pool);

    let wantedRate = 0;

    while (pool.length > 0) {
        const current = pool[0];

        if (wantedRate > 0) {
            ns.gang.setMemberTask(current, GangTasks.VigilanteJustice);
        }
        else {
            const task = decideFightTask(ns, current);
            ns.gang.setMemberTask(current, task);

            const initialWantedGain = ns.gang.getMemberInformation(current).wantedLevelGain;

            if (wantedRate + initialWantedGain > 0) {
                ns.gang.setMemberTask(current, GangTasks.VigilanteJustice);
                wantedRate += ns.gang.getMemberInformation(current).wantedLevelGain;
            }
            else {
                wantedRate += initialWantedGain;
            }
        }
        pool = removeFromArray(pool, 0)[1];
    }

    return pool;
}

function decideFightTask(ns: NS, member: string): string { 
    const territory = (<any>ns.gang.getOtherGangInformation())[getCurrentGang()].territory;

    if (ns.gang.getMemberInformation(member).str > 30000) {
        return GangTasks.ArmedRobbery;
    }
    else if (ns.gang.getMemberInformation(member).str > 16000) {
        return GangTasks.RunACon;
    }
    else if (ns.gang.getMemberInformation(member).str > 12000) {
        return GangTasks.ArmedRobbery;
    }
    else if (ns.gang.getMemberInformation(member).str > 8000) {
        return GangTasks.StrongarmCivilians;
    }
    else {
        return GangTasks.MugPeople;
    }
}

function getCurrentGang(): string {
    return 'Slum Snakes';
}

function setAllVigilante(ns: NS): void {
    const members = ns.gang.getMemberNames();

    for (const member of members) {
        ns.gang.setMemberTask(member, GangTasks.VigilanteJustice);
    }
}

function setTraining(ns: NS): void {
    const members = ns.gang.getMemberNames();

    const territoryMembers: Array<string> = [];

    // const useful = members.filter(m => isUseful(ns, m));
    // const first = removeRandomFromArray(useful);
    // territoryMembers.push(first[0]);
    // const second = removeRandomFromArray(first[1]);
    // territoryMembers.push(second[0]);

    // for (const member of territoryMembers) {
    //     ns.gang.setMemberTask(member, GangTasks.TerritoryWarfare);
    // }

    for (const member of members.filter(m => territoryMembers.indexOf(m) === -1)) {
        ns.gang.setMemberTask(member, GangTasks.TrainCombat);
    }
}

function doAscend(ns: NS, cutoff: number): void {
    const canAscend = ns.gang.getMemberNames().filter(m => ns.gang.getAscensionResult(m));
    const ordered = orderBy(canAscend, m => (<GangMemberAscension>ns.gang.getAscensionResult(m)).str);

    for (const member of ordered) {
        if (shouldAscend(ns, member)) {
            ns.gang.ascendMember(member);
            lastAscendCycle = currentCycle;
            equipAfterAscension(ns, member);
            break;
        }
    }
}

function isUseful(ns: NS, member: string): boolean {
    const averageStrength = average(ns.gang.getMemberNames().map(m => ns.gang.getMemberInformation(m).str), v => v);
    //const averageRespect = average(ns.gang.getMemberNames().map(m => ns.gang.getMemberInformation(m).earnedRespect), v => v);

    return ns.gang.getMemberInformation(member).str > (usefulPercentage * averageStrength);
}

function equipAfterAscension(ns: NS, member: string): void {
    const memberInfo = ns.gang.getMemberInformation(member);

    if (memberInfo.str_asc_mult > 50) {
        purchaseIfAffordable(ns, member, GangEquipment.Glock);
    }
    if (memberInfo.str_asc_mult > 30) {
        purchaseIfAffordable(ns, member, GangEquipment.Katana);
    }
    if (memberInfo.str_asc_mult > 10) {
        purchaseIfAffordable(ns, member, GangEquipment.BaseballBat);
    }
}

function purchaseIfAffordable(ns: NS, member: string, equipment: string): void {
    const equipPercent = ns.gang.getEquipmentCost(equipment) / ns.getServerMoneyAvailable(ServerNames.Home);

    if (equipPercent < 0.001) {
        ns.gang.purchaseEquipment(member, equipment);
    }
}

function shouldAscend(ns: NS, member: string): boolean {
    const nextResult = ns.gang.getAscensionResult(member);

    if (!nextResult) {
        return false;
    }

    const next = <GangMemberAscension>nextResult;
    
    return next.str > getAscensionCutoff(ns, member)
        && (ns.gang.getMemberInformation(member).earnedRespect / totalRespect(ns) < 0.3)
        && cycleCount - lastAscendCycle > ascendLimiter;
}

function getAscensionCutoff(ns: NS, member: string): number {
    const memberHash = basicSumHasher(member) 
        + Math.floor(ns.gang.getMemberInformation(member).str_asc_mult);
    const cutoff = <number>ascensionCutoffTable.get(memberHash % ascensionCutoffTable.size);

    return cutoff;
}

function totalRespect(ns: NS): number {
    let sum = 0;
    ns.gang.getMemberNames().forEach(m => sum += ns.gang.getMemberInformation(m).earnedRespect);
    return sum;
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

function removeRandomFromArray<T>(array: Array<T>): [T, Array<T>] {
    const index = randomIntBetween(0, array.length-1);
    const result = removeFromArray(array, index);

    return [result[0], result[1]];
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