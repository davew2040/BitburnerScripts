import { max } from "lodash";
import { NodeStats } from "/../NetscriptDefinitions";
import { ServerNames } from "/globals";

const homeServer = "home";
const moneyBuffer = 10*1000*1000;
const sleepTime = 3000;
const upgradeIncrement = 1;

enum UpgradeType {
	Level,
	Ram,
	Cores,
	Nodes
}

class Maximums {
	public static Cores = 16;
	public static Ram = 64;
	public static Level = 200;
}

interface TypeValuePair {
	type: UpgradeType,
	value: number
}

interface TypeHandler {
	tryUpgrade: (ns: NS) => void
}

interface NodeHandler {
	getValue: (ns: NS, index: number) => number,
	upgrade: (ns: NS, index: number, value: number) => void,
	getCost: (ns: NS, index: number, value: number) => number
}

class LevelHandler implements NodeHandler {
	getValue(ns: NS, index: number): number {
		return ns.hacknet.getNodeStats(index).level;
	}
	upgrade(ns: NS, index: number, value: number): void {
		ns.hacknet.upgradeLevel(index, value);
	}
	getCost(ns: NS, index: number, value: number)  {
		return ns.hacknet.getLevelUpgradeCost(index, value);
	}
}

class CoresHandler implements NodeHandler {
	getValue(ns: NS, index: number): number {
		return ns.hacknet.getNodeStats(index).cores;
	}
	upgrade(ns: NS, index: number, value: number): void {
		ns.hacknet.upgradeCore(index, value);
	}
	getCost(ns: NS, index: number, value: number)  {
		return ns.hacknet.getCoreUpgradeCost(index, value);
	}
}

const tiers: Array<TypeValuePair> = [
	{
		type: UpgradeType.Nodes, 
		value: 10,
	},
	{	
		type: UpgradeType.Level, 
		value: 100	
	},
	{	
		type: UpgradeType.Ram, 
		value: 8
	},
	{	
		type: UpgradeType.Cores, 
		value: 2
	},
	{
		type: UpgradeType.Nodes, 
		value: 20,
	},
	{	
		type: UpgradeType.Level, 
		value: 200	
	},
	{	
		type: UpgradeType.Ram, 
		value: Maximums.Ram
	},
	{	
		type: UpgradeType.Cores, 
		value: Maximums.Cores
	},
	{
		type: UpgradeType.Nodes, 
		value: 23,
	},
	{	
		type: UpgradeType.Level, 
		value: 200	
	},
	{	
		type: UpgradeType.Ram, 
		value: Maximums.Ram
	},
	{	
		type: UpgradeType.Cores, 
		value: Maximums.Cores
	},
];

/** @param {NS} ns **/
export async function main(ns: NS) {
	await upgradeAllNodes(ns);
}

/** @param {NS} ns **/
async function upgradeAllNodes(ns: NS) {
	for (const tier of tiers) {
		if (tier.type === UpgradeType.Nodes) {
			while (ns.hacknet.numNodes() < tier.value) {
				if (ns.hacknet.getPurchaseNodeCost() < hacknetFunds(ns)) {
					ns.hacknet.purchaseNode();
				}
				else {
					await ns.sleep(sleepTime);
				}
			}
		}
		else if (tier.type === UpgradeType.Level) {
			await upgradeNodeSetFixed(ns, new LevelHandler(), tier.value);
		}
		else if (tier.type === UpgradeType.Cores) {
			await upgradeNodeSetFixed(ns, new CoresHandler(), tier.value);
		}
		else if (tier.type === UpgradeType.Ram) {
			await upgradeRam(ns, tier.value);
		}
		else {
			throw `Unrecognized upgrade type ${tier.type}`;
		}
	}
}

async function upgradeNodeSetFixed(ns: NS, handler: NodeHandler, value: number): Promise<void> {
	for (let i=0; i<ns.hacknet.numNodes(); i++) {
		const upgradeAmount = value - handler.getValue(ns, i);
		if (upgradeAmount > 0) {
			const upgradeCost = handler.getCost(ns, i, upgradeAmount);
			while (upgradeCost > hacknetFunds(ns)) {
				await ns.sleep(sleepTime);
			}
			handler.upgrade(ns, i, upgradeAmount);
		}
	}
}

async function upgradeRam(ns: NS, value: number): Promise<void> {
	for (let i=0; i<ns.hacknet.numNodes(); i++) {
		while (ns.hacknet.getNodeStats(i).ram < value) {
			if (ns.hacknet.getRamUpgradeCost(i, 1) > hacknetFunds(ns)) {
				await ns.sleep(sleepTime);
			}
			else {
				ns.hacknet.upgradeRam(i, 1);
			}
		}
	}
}

/** @param {NS} ns **/
function getLowestNode(ns: NS): number {
	let smallestNode = 0;
	for (let i=1; i<ns.hacknet.numNodes(); i++) {
		if (ns.hacknet.getNodeStats(i).ram < ns.hacknet.getNodeStats(smallestNode).ram) {
			smallestNode = i;
		}
	}
	return smallestNode;
}

function hacknetFunds(ns: NS) {
	return Math.max(ns.getServerMoneyAvailable(ServerNames.Home) - moneyBuffer, 0);
}