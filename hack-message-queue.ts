import { NS } from '@ns'
import { Ports } from '/globals'

export interface HackMessage {
    source: string;
    target: string;
    memory: number;
}

export class HackMessageQueue {
    public empty(ns: NS): boolean {
        return ns.getPortHandle(Ports.HackMessageQueue).empty();
    }

    public async enqueue(ns: NS, message: HackMessage): Promise<void> {
        await ns.writePort(Ports.HackMessageQueue, JSON.stringify(message));
    }

    public dequeue(ns: NS): HackMessage {
        if(this.empty(ns)) {
            throw `Attempted dequeue from empty queue!`;
        }

        const json = ns.readPort(Ports.HackMessageQueue);

        return JSON.parse(json);
    }

    public clear(ns: NS): void {
        ns.clearPort(Ports.HackMessageQueue);
    }
}