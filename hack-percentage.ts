import { NS } from '@ns'
import { notStrictEqual } from 'assert';
import { stubTrue } from 'lodash';
import { Costs, MyScriptNames, ServerNames } from '/globals';
import { grow, hack, weaken } from '/process-launchers';
import { serverStore } from '/server-store';

const cycleBuffer = 1000;
const growWeakenBuffer = 1.1;

interface Input {
    target: string,
    source: string,
    weakenThreads: number,
    growThreads: number,
    hackThreads: number
}

export async function main(ns : NS) : Promise<void> {
    if (!ns.args[0] || !ns.args[1] || !ns.args[2] || !ns.args[3]) {
        throw "Missing arguments.";
    }

    const target = <string>ns.args[0];
    const source = <string>ns.args[1];
    const inputWeakenThreads = <number>ns.args[2];
    const inputGrowThreads = <number>ns.args[3];
    const inputHackThreads = <number>ns.args[4]; 

    const input: Input = {
        target: target,
        source: source,
        weakenThreads: inputWeakenThreads,
        growThreads: inputGrowThreads,
        hackThreads: inputHackThreads
    }

    const weakenTime = ns.getWeakenTime(target);
    const cycleTime = weakenTime + cycleBuffer;

    while (true) {
        try {
            dumpServerStats(ns, target);

            if (ns.getServerMoneyAvailable(target) < 0.99 * ns.getServerMaxMoney(target) ||
                    ns.getServerSecurityLevel(target) > 1.01*ns.getServerMinSecurityLevel(target)) {
                ns.tprint(`Starting grow/weaken cycle for ${cycleTime}ms`);
                doPrepare(ns, input);
            }
            else {
                const cycleTime = weakenTime+1000;
    
                ns.tprint(`Starting hack cycle for ${cycleTime}ms`);
    
                ns.tprint(`hacking on ${inputHackThreads} threads`);
                ns.tprint(`growing on ${inputGrowThreads} threads`);
                ns.tprint(`weakening on ${inputWeakenThreads} threads`);
    
                hack(ns, source, target, inputHackThreads);
                grow(ns, source, target, inputGrowThreads);
                weaken(ns, source, target, inputWeakenThreads);
            }
    
            await ns.sleep(cycleTime);
        }
        catch (e) {
            ns.tprint(`Error occurred while hacking percentage: ${e}`);
        }
    }
}

function doPrepare(ns:NS, input: Input) {
    const prepareGrowThreads = Math.ceil(
            growWeakenBuffer * ns.growthAnalyze(
                input.target,  
                ns.getServerMaxMoney(input.target) / ns.getServerMoneyAvailable(input.target),
                ns.getServer(input.source).cpuCores
            )
    );
    const securityDeficit = (ns.getServerSecurityLevel(input.target) - ns.getServerMinSecurityLevel(input.target))
        + (prepareGrowThreads * Costs.growSecurityCostPerThread);
    const prepareWeakenThreads = securityDeficit / Costs.weakenSecurityReductionPerThread;

    const [scaledGrowThreads, scaledWeakenThreads] = scalePreparationToInput(ns, input.source, prepareGrowThreads, prepareWeakenThreads);

    const clampedGrowThreads =  Math.ceil(Math.max(scaledGrowThreads, 1));
    const clampedWeakenThreads =  Math.ceil(Math.max(scaledWeakenThreads, 1));

    ns.tprint(`Growing on ${clampedGrowThreads} threads`);
    ns.tprint(`Weakening on ${clampedWeakenThreads} threads`);

    grow(ns, input.source, input.target, Math.max(clampedGrowThreads, 1));
    weaken(ns, input.source, input.target, Math.max(clampedWeakenThreads, 1));
}

function scalePreparationToInput(ns: NS, host:string, prepareGrow: number, prepareWeaken: number)
        : [number, number] {
    const totalScriptMemory = prepareGrow * ns.getScriptRam(MyScriptNames.Grow) 
            + prepareWeaken * ns.getScriptRam(MyScriptNames.Weaken);
    const totalHostMemory = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);

    if (totalScriptMemory > totalHostMemory) {
        const ratio = 0.9 * (totalHostMemory / totalScriptMemory);
        return [prepareGrow * ratio, prepareWeaken * ratio];
    }
    else {
        return [prepareGrow, prepareWeaken]
    }
}

function dumpServerStats(ns: NS, hostName: string): void {
    const currentSecurity = ns.getServerSecurityLevel(hostName);
    const minSecurity = ns.getServerMinSecurityLevel(hostName);

    const currentMoney = ns.getServerMoneyAvailable(hostName);
    const maxMoney = ns.getServerMaxMoney(hostName);

    ns.tprint(`server stats for target = ${hostName}`);
    ns.tprint(`security ${currentSecurity}/${minSecurity}`);
    ns.tprint(`money = ${currentMoney}/${maxMoney}`);
}