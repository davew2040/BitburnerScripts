import { NS } from '@ns'
import { transform } from 'lodash';
import { findPath } from '/utilities'

class Targets {
    public static iiii = "I.I.I.I";
}

export async function main(ns : NS) : Promise<void> {
    await connectTo(ns, Targets.iiii);
}

async function connectTo(ns: NS, target: string): Promise<void> {
    const paths = findPath(ns, target);
    if (paths.length === 0) {
        throw `Could not find path to ${target}`;
    }

    for (const path of paths) {
        await ns.connect(path);
    }
}