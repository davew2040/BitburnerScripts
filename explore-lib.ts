import { NS } from '@ns'

export async function exploitServer(ns: NS, hostName: string): Promise<void> {
    if (ns.fileExists("brutessh.exe")) {
        await ns.brutessh(hostName);
    }
    if (ns.fileExists("ftpcrack.exe")) {
        await ns.ftpcrack(hostName);
    }
    if (ns.fileExists("relaySMTP.exe")) {
        await ns.relaysmtp(hostName);
    }
    if (ns.fileExists("HTTPWorm.exe")) {
        await ns.httpworm(hostName);
    }
    if (ns.fileExists("SQLInject.exe")) {
        await ns.sqlinject(hostName);
    }
    
    await ns.nuke(hostName); 
}