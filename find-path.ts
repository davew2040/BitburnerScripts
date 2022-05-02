import { NS } from '@ns'
import { notStrictEqual } from 'assert';
import { nth } from 'lodash';
import { findPath } from '/utilities';

export async function main(ns : NS) : Promise<void> {
    const targetHost = <string>ns.args[0];

    const path = findPath(ns, targetHost);

    if (path.length === 0) {
        ns.tprint(`No path available.`);
        return;
    }

    ns.tprint(`path = `, path.join(" -> "));

    if (ns.args[1] === "connect") {
        connectTo(ns, path);
    }
}

function connectTo(ns: NS, path: Array<string>): void {
    for (let i=1; i<path.length; i++) {
        const next = path[i];
        ns.connect(next);
    }
}