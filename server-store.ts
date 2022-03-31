import { NS } from '@ns'
import { ServerNames } from '/globals';

const privateServerPrefix = 'pserv';
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
	getSourceServers(ns: NS): Array<string> {
		return [ServerNames.Home, ...this.getStolenServers(), ...ns.getPurchasedServers()];
	}

	getStolenServers(): Array<string> {
		return [...hackedServers];
	}
}

export const serverStore = new ServerStore();

export function getPrivateServerName(index: number): string {
	return `${privateServerPrefix}-${index}`;
}