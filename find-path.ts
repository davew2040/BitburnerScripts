import { NS } from '@ns'
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
}