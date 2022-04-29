import { NS } from '@ns'
import { ServerNames } from '/globals';
import { exploreServers } from '/utilities';

export const privateServerPrefix = 'pserv';

const sourcesExcludeList = ["foodnstuff"];

export class ServerStore {
	getControlledSources(ns: NS): Array<string> {
		return [ServerNames.Home, ...ns.getPurchasedServers(), ...this.getStolenServers(ns)];
	}

	getSourceServers(ns: NS): Array<string> {
		return [ServerNames.Home, ...ns.getPurchasedServers(), ...this.getStolenServers(ns)]
			.filter(s => sourcesExcludeList.indexOf(s) === -1);
	}

	getStolenServers(ns: NS): Array<string> {
		return findStolenServers(ns);
	}

	getPotentialTargets(ns: NS): Array<string> {
		return findLargePotentialTargetSet(ns);
	}
}

export const serverStore = new ServerStore();

export function getPrivateServerName(index: number): string {
	return `${privateServerPrefix}-${index}`;
}

function findLargePotentialTargetSet(ns: NS) {
	const targets: Array<string> = [];

	exploreServers(ns, 20, serverName => {
		if (ns.hasRootAccess(serverName)) {
			targets.push(serverName);
		}
	});

	return targets.filter(t => isNotOwned(ns, t));
}

function isNotOwned(ns: NS, hostName: string): boolean {
	return hostName !== ServerNames.Home && ns.getPurchasedServers().indexOf(hostName) === -1;
}

function findStolenServers(ns: NS) {
	const stolen: Array<string> = [];

	exploreServers(ns, 16, serverName => {
		if (ns.hasRootAccess(serverName)) {
			stolen.push(serverName);
		}
	});

	return stolen.filter(t => isNotOwned(ns, t));
}
