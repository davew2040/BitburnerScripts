import { NS } from '@ns'

import { serverStore } from './server-store';
import { MyScriptNames, ServerNames } from './globals';
import { Server } from 'http';

// const copyFiles = [
// 	MyScriptNames.FactionGain,
// 	MyScriptNames.Grow,
// 	MyScriptNames.Weaken,
// 	MyScriptNames.Hack,
//     MyScriptNames.PortLogger,
// 	MyScriptNames.Share,
// 	MyScriptNames.HackByPercentageSingle,
// 	MyScriptNames.HackByPercentageSet,
// 	MyScriptNames.ProcessLaunchers,
// 	MyScriptNames.UniqueGenerator,
//     "globals.js",
//     "utilities.js"
// ]

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
	const servers = serverStore.getControlledSources(ns).filter(s => s !== ServerNames.Home);

    ns.tprint(`SERVERS = `, servers);

	for (const server of servers) {

		try {
			await prepareHost(ns, server);
		}
		catch (e) {
			ns.tprint(`Encountered exception ${e} while running scripts on host ${server}`);
		}
	}
}

async function prepareHost(ns: NS, hostName: string) {
    ns.tprint(`Preparing host ${hostName}...`);

	//ns.killall(hostName);
	//deleteFiles(ns, hostName);

	const copyFiles = ns.ls(ServerNames.Home).filter(f => f.endsWith(".js"));

	for (const copyFile of copyFiles) {	
		await ns.scp(copyFile, hostName);
	}
}

function deleteFiles(ns: NS, hostName: string): void {
	if (hostName === ServerNames.Home) {
		return;
	}

	const hostFiles = ns.ls(hostName).filter(s => s.endsWith(".js"));

	ns.tprint(`Deleting files ${hostFiles} on ${hostName}`);

	for (const hostFile of hostFiles) {
		ns.rm(hostFile, hostName);
	}
}