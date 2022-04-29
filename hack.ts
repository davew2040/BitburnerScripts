import { NS } from '@ns'
import { formatNumber } from '/utilities';

export async function main(ns : NS) : Promise<void> {
    const targetHost = <string>ns.args[0];
    // const logger = new PortLogger(PortLoggerType.LogHack);
    // const errorLogger = new PortLogger(PortLoggerType.LogError);

    // const initialMoney = ns.getServerMoneyAvailable(targetHost);
    // const moneyLimit = ns.getServerMaxMoney(targetHost);
    // const successChance = ns.hackAnalyzeChance(targetHost);
    // const time = ns.getHackTime(targetHost);

    try {
       // await logger.log(ns,`HACK START ON ${targetHost} time = ${(time/1000).toFixed(2)}s success chance = ${successChance.toFixed(2)} money = ${formatNumber(initialMoney)}/${formatNumber(moneyLimit)} `);

        const stolen = await ns.hack(<string>targetHost);

        //const finalMoney = ns.getServerMoneyAvailable(targetHost);

       // await logger.log(ns,`HACK COMPLETE ON ${targetHost} stolen = ${formatNumber(stolen)} (${(100*stolen/moneyLimit).toFixed(2)}%) final money = ${formatNumber(finalMoney)}/${formatNumber(moneyLimit)}`);
    }
    catch (e) {
        //await errorLogger.log(ns, `Error encountered during hack: ${e}`);
    }
}