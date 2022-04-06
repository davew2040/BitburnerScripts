import { NS } from '@ns'
import { MyScriptNames } from '/globals'
import { serverStore } from '/server-store'
import { exploreServers } from '/utilities'

const protectedScripts = [
    MyScriptNames.LogCollect
]

export async function main(ns : NS) : Promise<void> {
    const servers = serverStore.getSourceServers(ns);

    for (const server of servers) {
        for (const process of ns.ps(server)) {
            if (protectedScripts.indexOf(process.filename) === -1) {
                ns.kill(process.pid);
            }
        }
    }
}