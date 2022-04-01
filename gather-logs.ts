import { NS } from '@ns'
import { LogFiles, Ports } from '/globals'

const portFileMap = new Map<number, string>(
    [
        [ Ports.LogsGrow, LogFiles.LogsGrow ],
        [ Ports.LogsHack, LogFiles.LogsHack ],
        [ Ports.LogsWeaken, LogFiles.LogsWeaken ],
    ]
);

        
export async function main(ns : NS) : Promise<void> {
    while (true) {
        await flushLogs(ns);
        await ns.sleep(1000);
    }
}

async function flushLogs(ns: NS): Promise<void> {
    await readPorts(ns);
}

async function readPorts(ns: NS) {
    for (const port of portFileMap.keys()) {
        const fileName = <string>portFileMap.get(port);
        const portHandle = ns.getPortHandle(port);

        while (!portHandle.empty()) { 
            const portValue = ns.readPort(port);
            await ns.write(fileName, portValue, "a");
        }
    }
}