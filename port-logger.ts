import { NS } from '@ns'
import { Ports } from '/globals';

export enum PortLoggerType {
    LogDefault,
    LogGrow,
    LogWeaken,
    LogHack,
    LogTemp,
    LogError,
}

export class PortLoggerMessage {
    public message: string;
    public type: PortLoggerType;
    public date: Date;

    constructor(message: string, type: PortLoggerType, date: (Date | null) = null) {
        this.message = message;
        this.type = type;
        if (date === null) {
            this.date = new Date();
        }
        else {
            this.date = date;
        }
    }
}

export class PortLogger {
    private type: PortLoggerType;

    constructor(type: PortLoggerType) {
        this.type = type;
    }
 
    public async log(ns: NS, message: string): Promise<void> {
        const portLoggerMessage = new PortLoggerMessage(message, this.type);

        await ns.writePort(
            Ports.GenericLogger, 
            JSON.stringify(portLoggerMessage)
        );
    }
}