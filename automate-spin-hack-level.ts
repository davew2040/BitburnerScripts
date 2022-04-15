import { NS } from '@ns'
import { MyScriptNames, ServerNames } from '/globals'
import { getPrivateServerName } from '/server-store';

const targets = [
    "pserv-3",
    "pserv-4",
    "pserv-5",
    "pserv-6",
    "pserv-7",
    "pserv-8",
    "pserv-9",
    "pserv-10",
    "pserv-11",
    "pserv-12",

]

export async function main(ns : NS) : Promise<void> {
    for (const target of getTargets()) {
        ns.exec(MyScriptNames.SpinHackLevel, target, 1, target, ServerNames.FoodNStuff, 90);
    }
}

function getTargets(): Array<string> {
    const targets = [];
    for (let i=6; i<=25; i++) {
        targets.push(getPrivateServerName(i));
    }
    return targets;
}