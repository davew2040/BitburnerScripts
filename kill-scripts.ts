import { NS } from '@ns'
import { MyScriptNames, ServerNames } from '/globals'
import { serverStore } from '/server-store'
import { exploreServers } from '/utilities'

const protectedScripts = [
    MyScriptNames.KillScripts,
    MyScriptNames.LogCollect,
    MyScriptNames.LogPrune
]

export async function main(ns : NS) : Promise<void> {
    let scriptName:(string | null) = null;
    if (ns.args[0]) {
        scriptName = <string>(ns.args[0]);
    }

    const servers = serverStore.getSourceServers(ns);

    for (const server of servers) {
        if (scriptName) {
            for (const process of ns.ps(server)) {
                if (protectedScripts.indexOf(process.filename) === -1) {
                    ns.kill(process.pid, server);
                }
            }
        }
        else {
            if (server === ServerNames.Home) {
                for (const process of ns.ps(server)) {
                    if (protectedScripts.indexOf(process.filename) === -1) {
                        ns.kill(process.pid);
                    }
                }
            }
            else {
                ns.killall(server);
            }
        }
    }
}