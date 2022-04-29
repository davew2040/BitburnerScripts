/*
usage: run repNeededForFavor.js favorTarget
    returns how much reputation you need in total with a faction or company to reach the favor favorTarget.
    (as of v0.37.1, the constans are the same for factions and companies)
formula adapted from Faction.js/getFavorGain(), Company.js/getFavorGain() and Constants.js:
    https://github.com/danielyxie/bitburner/blob/master/src/Faction.js
    
    also available as netscript 1.0 script (running in Firefox)
    https://github.com/sschmidTU/BitBurnerScripts/
    @author sschmidTU
*/

function repNeededForFavorOld(targetFavor: number): number {
    
    let favorGain = 0;
    let rep = 0;
    
    const ReputationToFavorBase = 500;
    const ReputationToFavorMult = 1.02;
    
    let reqdRep = ReputationToFavorBase;
    while (favorGain < targetFavor) {
        rep += reqdRep;
        ++favorGain;
        reqdRep *= ReputationToFavorMult;
    }
    
    return rep;
}

function repNeededForFavor(favor: number): number {
    const r = (Math.pow(1.02, favor-1) * 25500) - 25000;

    return r;
}

export async function main(ns: NS) {
    const end = <number>ns.args[0];
    let start = 0;
    if (ns.args[1]) {
        start = <number>ns.args[1];
    }

    const repNeeded = repNeededForFavor(end) - repNeededForFavor(start);
      
    ns.tprint(`You need ${Math.floor(repNeeded)} total reputation with a faction or company`
        + ` to get from ${start} to ${end} favor.`);
}
