import { NS } from '@ns'
import { join } from 'path';

export async function main(ns : NS) : Promise<void> {
    if (ns.args.length !== 2) {
        ns.tprint("Usage: psx <search_text> <host>");
        return;
    }

    const search = <string>ns.args[0];
    const host = <string>ns.args[1];

    const procs = ns.ps(host);

    for (const proc of procs) {
        if (proc.filename.includes(search)) {
            ns.tprint(`${proc.pid} - ${proc.filename}`);
        }
    } 
}