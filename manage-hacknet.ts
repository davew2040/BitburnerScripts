import { max } from "lodash";
import { NodeStats } from "/../NetscriptDefinitions";
import { ServerNames } from "/globals";

const homeServer = "home";
const moneyBuffer = 1000;
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
		ns.hacknet.upgradeLevel(index, 1);
	}
	getCost(ns: NS, index: number, value: number)  {
		return ns.hacknet.getLevelUpgradeCost(index, 1);
	}
}

class CoresHandler implements NodeHandler {
	getValue(ns: NS, index: number): number {
		return ns.hacknet.getNodeStats(index).cores;
	}
	upgrade(ns: NS, index: number, value: number): void {
		ns.hacknet.upgradeCore(index, 1);
	}
	getCost(ns: NS, index: number, value: number)  {
		return ns.hacknet.getCoreUpgradeCost(index, 1);
	}
}

const tiers: Array<TypeValuePair> = [
	{
		type: UpgradeType.Nodes, 
		value: 4,
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
		type: UpgradeType.Nodes, 
		value: 8,
	},
	{
		type: UpgradeType.Level, 
		value: 200,
	},
	{
		type: UpgradeType.Nodes, 
		value: 20,
	},
];

/** @param {NS} ns **/
export async function main(ns: NS) {
	await upgradeAllNodes(ns);
}

/** @param {NS} ns **/
async function upgradeAllNodes(ns: NS) {
	while (true) {
		const result = await doNextUpgrade(ns);

		if (!result) {
			break;
		}
		else {
			await ns.sleep(1);
		}
	}
}

async function doNextUpgrade(ns: NS): Promise<boolean> {
	for (const tier of tiers) {
		const result = await tryUpgradeTier(ns, tier);

		if (result === true) {
			return true;
		}
	}

	return false;
}

async function tryUpgradeTier(ns: NS, tier: TypeValuePair): Promise<boolean> {
	if (tier.type === UpgradeType.Nodes) {
		return await upgradeNodes(ns, tier);
	}
	else if (tier.type === UpgradeType.Level) {
		return await upgradeNodeSetFixed(ns, new LevelHandler(), tier.value);
	}
	else if (tier.type === UpgradeType.Cores) {
		return await upgradeNodeSetFixed(ns, new CoresHandler(), tier.value);
	}
	else if (tier.type === UpgradeType.Ram) {
		return await upgradeRam(ns, tier.value);
	}
	else {
		throw `Unrecognized upgrade type ${tier.type}`;
	}
}

async function upgradeNodes(ns: NS, tier: TypeValuePair): Promise<boolean> {
	if (ns.hacknet.numNodes() >= tier.value) {
		return false;
	}

	while (hacknetFunds(ns)  < ns.hacknet.getPurchaseNodeCost()) {
		await ns.sleep(sleepTime);
	}

	ns.hacknet.purchaseNode();

	return true;
}

async function upgradeNodeSetFixed(ns: NS, handler: NodeHandler, value: number): Promise<boolean> {
	for (let i=0; i<ns.hacknet.numNodes(); i++) {
		const upgradeAmount = value - handler.getValue(ns, i);

		if (upgradeAmount > 0) {
			const upgradeCost = handler.getCost(ns, i, upgradeAmount);
			while (upgradeCost > hacknetFunds(ns)) {
				await ns.sleep(sleepTime);
			}
			handler.upgrade(ns, i, upgradeAmount);
			return true;
		}
	}

	return false;
}

async function upgradeRam(ns: NS, value: number): Promise<boolean> {
	for (let i=0; i<ns.hacknet.numNodes(); i++) {
		if (ns.hacknet.getNodeStats(i).ram < value) {
			while (hacknetFunds(ns) < ns.hacknet.getRamUpgradeCost(i, 1)) {
				await ns.sleep(sleepTime);
			}
			
			ns.hacknet.upgradeRam(i, 1);
			return true;
		}
	}

	return false;
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