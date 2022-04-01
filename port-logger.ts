import { NS } from '@ns'

export class PortLoggerMessage {
    public message: string;
    public port: number;

    constructor(message: string, port: number) {
        this.message = message;
        this.port = port;
    }
}

export class PortLogger {
    private _port

    constructor(port: number) {
        this._port = port;
    }
 
    public async log(ns: NS, message: string): Promise<void> {
        await ns.writePort(
            this._port, 
            `${this.formatCurrentDate()} - ${message}"\n"`
        );
    }

    private formatCurrentDate(): string {
        return (new Date()).toTimeString();
    }
}