import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    ns.exec("hack.js", "pserv-1", 200, "omega-net");
    ns.exec("hack.js", "pserv-2", 200, "phantasy");
}   