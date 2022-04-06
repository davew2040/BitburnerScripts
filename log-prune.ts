import { NS } from '@ns'
import { typeFileMap } from '/log-collect'

const delayMilliseconds = 5*60*1000;
const maxLines = 10000;
const prunedLines = 500;

export async function main(ns : NS) : Promise<void> {
    const files = typeFileMap.values();

    while (true) {
        for (const file of files) {
            const oldLines = (<string>ns.read(file)).split("\n");
            if (oldLines.length > maxLines) {
                const newLines = [];
                for (let i=oldLines.length-prunedLines; i<oldLines.length; i++) {
                    newLines.push(oldLines[i]);
                }
                await ns.write(file, newLines.join("\n"), "w");
            }
        }
        await ns.sleep(delayMilliseconds);
    }
}