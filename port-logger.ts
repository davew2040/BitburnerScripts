import { NS } from '@ns'
import { Ports } from '/globals';

export enum PortLoggerTypes {
    LogDefault,
    LogGrow,
    LogWeaken,
    LogHack
}

export class PortLoggerMessage {
    public message: string;
    public type: PortLoggerTypes;
    public date: Date;

    constructor(message: string, type: PortLoggerTypes, date: (Date | null) = null) {
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
    private type: PortLoggerTypes;

    constructor(type: PortLoggerTypes) {
        this.type = type;
    }
 
    public async log(ns: NS, message: string): Promise<void> {
        const portLoggerMessage = new PortLoggerMessage(message, this.type);

        await ns.writePort(
            Ports.GenericLogger, 
            JSON.stringify(portLoggerMessage)
        );
    }

    private formatCurrentDate(): string {
        return (new Date()).toTimeString();
    }
}