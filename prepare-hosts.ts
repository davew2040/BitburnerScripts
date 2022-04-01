import { NS } from '@ns'

import { serverStore } from './server-store';
import { ServerNames } from './globals';

const copyFiles = [
	"grow.js",
	"weaken.js",
	"hack.js",
    "port-logger.js",
    "globals.js",
    "utilities.js"
]

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
	const servers = serverStore.getSourceServers(ns).filter(s => s !== ServerNames.Home);

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

	ns.killall(hostName);
	deleteFiles(ns, hostName);

    ns.tprint(`Copying files ${copyFiles.join(", ")}`);

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