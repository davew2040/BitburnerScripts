import { NS } from '@ns'

const crimes = [
    "heist",
    "assassination",
    "kidnap",
    "grand theft auto",
    "homicide",
    "larceny",
    "mug someone",
    "rob store",
    "shoplift",
   ];

export async function main(ns : NS) : Promise<void> {
    ns.commitCrime(crimes[7]);
}