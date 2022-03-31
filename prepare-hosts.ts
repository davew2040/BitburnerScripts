import { NS } from '@ns'

import { serverStore } from './server-store';
import { ServerNames } from './globals';

const copyFiles = [
	"grow.js",
	"weaken.js",
	"hack.js"
]

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
	const servers = serverStore.getSourceServers(ns);

	for (const server of servers) {
		const nextHost = server;

		try {
			await prepareHost(ns, nextHost);
		}
		catch (e) {
			ns.tprint(`Encountered exception ${e} while running scripts on host ${nextHost}`);
		}
	}
}

async function prepareHost(ns: NS, hostName: string) {
	if (ns.fileExists('BruteSSH.exe', "home")) {
		await ns.brutessh(hostName);
	}

	await ns.nuke(hostName);

	ns.killall(hostName);
	deleteFiles(ns, hostName);

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