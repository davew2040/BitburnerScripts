import { NS } from '@ns';
import { notStrictEqual } from 'assert';
import { nth } from 'lodash';
import { getPrivateServerName, serverStore } from '/server-store';
import { orderBy, orderByDescending } from '/utilities';

export async function main(ns : NS) : Promise<void> {
    const min = 1.15;
    const max = 1.65;

    let buffer = "";

    for (let i=0; i<10; i++) {
        const value = min + (max-min)*Math.random();
        buffer += (`[${i}, ${value.toFixed(2)}],\n`);
    }

    ns.tprint(buffer);
}    