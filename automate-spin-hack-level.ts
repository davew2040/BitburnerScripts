import { NS } from '@ns'
import { MyScriptNames, ServerNames } from '/globals'
import { getPrivateServerName } from '/server-store';

const targets = [
    "pserv-2"
]

export async function main(ns : NS) : Promise<void> {
    for (const target of getTargets()) {
        ns.exec(MyScriptNames.SpinHackLevel, target, 1, target, ServerNames.FoodNStuff, 90);
    }
}

function getTargets(): Array<string> {
    return targets;
}