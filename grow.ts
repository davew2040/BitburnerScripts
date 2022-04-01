import { NS } from '@ns'
import { PortLogger } from './port-logger';
import { Ports } from '/globals';
import { formatNumber } from '/utilities';

export async function main(ns : NS) : Promise<void> {
    const targetHost = <string>ns.args[0];
    const logger = new PortLogger(Ports.LogsGrow);

    const initialMoney = ns.getServerMoneyAvailable(targetHost);
    const moneyLimit = ns.getServerMaxMoney(targetHost);

    await logger.log(ns, `GROW START ON ${targetHost} money = ${formatNumber(initialMoney)}/${formatNumber(moneyLimit)}`);

    await ns.grow(<string>targetHost);

    const finalMoney = ns.getServerMoneyAvailable(targetHost);

    await logger.log(ns, `GROW COMPLETE ON ${targetHost} final money = ${formatNumber(finalMoney)}/${formatNumber(moneyLimit)} increase = ${finalMoney/initialMoney}`);
}