import { NS } from '@ns'
import { ServerNames } from '/globals';
import { exploreServers } from '/utilities';

export const privateServerPrefix = 'pserv';
const hackedServers = [
	'n00dles',
	'foodnstuff',
	'sigma-cosmetics',
	'joesguns',
	'hong-fang-tea',
	'harakiri-sushi',
	'iron-gym'
];

export class ServerStore {
	private _stolenServers: Array<string> = [];
	private _targetServers: Array<string> = [];

	getSourceServers(ns: NS): Array<string> {
		return [ServerNames.Home, ...ns.getPurchasedServers(), ...this.getStolenServers(ns)];
	}

	getStolenServers(ns: NS): Array<string> {
		if (this._stolenServers.length === 0) {
			this._stolenServers = findStolenServers(ns)
		}
		return this._stolenServers;
	}

	getPotentialTargets(ns: NS): Array<string> {
		if (this._targetServers.length === 0) {
			this._targetServers = findLargePotentialTargetSet(ns)
		}
		return this._targetServers;
	}
}

export const serverStore = new ServerStore();

export function getPrivateServerName(index: number): string {
	return `${privateServerPrefix}-${index}`;
}

function findLargePotentialTargetSet(ns: NS) {
	const targets: Array<string> = [];

	exploreServers(ns, 10, serverName => {
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

	exploreServers(ns, 7, serverName => {
		if (ns.hasRootAccess(serverName)) {
			stolen.push(serverName);
		}
	});

	return stolen.filter(t => isNotOwned(ns, t));
}
