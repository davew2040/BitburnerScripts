import { NS } from '@ns'
import { PortLogger, PortLoggerTypes } from './port-logger';
import { formatNumber } from '/utilities';

export async function main(ns : NS) : Promise<void> {
    const targetHost = <string>ns.args[0];
    const logger = new PortLogger(PortLoggerTypes.LogHack);

    const initialMoney = ns.getServerMoneyAvailable(targetHost);
    const moneyLimit = ns.getServerMaxMoney(targetHost);

    await logger.log(ns,`HACK START ON ${targetHost} money = ${formatNumber(initialMoney)}/${formatNumber(moneyLimit)}`);

    const stolen = await ns.hack(<string>targetHost);

    const finalMoney = ns.getServerMoneyAvailable(targetHost);

    await logger.log(ns,`HACK COMPLETE ON ${targetHost} stolen = ${formatNumber(stolen)} final money = ${formatNumber(finalMoney)}/${formatNumber(moneyLimit)} percentage = ${initialMoney/finalMoney}`);
}