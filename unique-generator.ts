import { NS } from '@ns'

let uid = 1;

export function getUid() {
    return uid++;
}