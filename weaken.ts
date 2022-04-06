import { NS } from '@ns'
import { PortLogger, PortLoggerTypes } from './port-logger';

export async function main(ns : NS) : Promise<void> {
    const targetHost = <string>ns.args[0];
    const logger = new PortLogger(PortLoggerTypes.LogWeaken);

    const initialSecurity = ns.getServerSecurityLevel(targetHost);
    const minSecurity = ns.getServerMinSecurityLevel(targetHost);

    await logger.log(ns, `WEAKEN START ON ${targetHost} initial security = ${initialSecurity} min =${minSecurity}`);
    
    await ns.weaken(<string>targetHost);

    const finalSecurity = ns.getServerSecurityLevel(targetHost);

    await logger.log(ns, `WEAKEN COMPLETE ON ${targetHost} final security = ${finalSecurity} initial = ${initialSecurity} min = ${minSecurity}`);
}