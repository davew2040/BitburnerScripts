import { NS } from '@ns'
import { LogFiles, Ports } from '/globals'
import { PortLoggerMessage, PortLoggerTypes } from '/port-logger';

export const typeFileMap = new Map<PortLoggerTypes, string>(
    [
        [ PortLoggerTypes.LogDefault, LogFiles.LogsDefault ],
        [ PortLoggerTypes.LogGrow, LogFiles.LogsGrow ],
        [ PortLoggerTypes.LogHack, LogFiles.LogsHack ],
        [ PortLoggerTypes.LogWeaken, LogFiles.LogsWeaken ],
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
    const portHandle = ns.getPortHandle(Ports.GenericLogger);

    while (!portHandle.empty()) { 
        const portValue = <string>ns.readPort(Ports.GenericLogger);
        const json = JSON.parse(portValue);

        const parsedValue: PortLoggerMessage = new PortLoggerMessage(
            json["message"],
            json["type"],
            new Date(Date.parse(json["date"]))
        )

        const fileName = <string>typeFileMap.get(parsedValue.type);
        await ns.write(fileName, `${parsedValue.date.toTimeString()} - ${parsedValue.message}\n`, "a");
    }
}
