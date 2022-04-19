import { NS } from '@ns'
import { LogFiles, Ports } from '/globals'
import { PortLoggerMessage, PortLoggerType } from '/port-logger';
import { padLeft } from '/utilities';

export const typeFileMap = new Map<PortLoggerType, string>(
    [
        [ PortLoggerType.LogDefault, LogFiles.LogsDefault ],
        [ PortLoggerType.LogGrow, LogFiles.LogsGrow ],
        [ PortLoggerType.LogHack, LogFiles.LogsHack ],
        [ PortLoggerType.LogWeaken, LogFiles.LogsWeaken ],
        [ PortLoggerType.LogTemp, LogFiles.LogsTemp ],
        [ PortLoggerType.LogError, LogFiles.LogsError ],
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
        const message = `${formatDate(parsedValue.date)} - ${parsedValue.message}\n`;
        await ns.write(fileName, message, "a");
    }
}

function formatDate(date: Date): string {
    return `${padLeft(date.getHours().toString(), 2, "0")}:${padLeft(date.getMinutes().toString(), 2, "0")}:`
        + `${padLeft(date.getSeconds().toString(), 2, "0")}:${padLeft(date.getMilliseconds().toString(), 3, "0")}`;
}