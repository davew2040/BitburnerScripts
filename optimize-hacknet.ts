
import { NodeStats } from "/../NetscriptDefinitions";
import { ServerNames } from "/globals";
import { orderByDescending } from "/utilities";

const breakEvenTimeSeconds = 60*60*1000;
const timeBetweenActionsMilliseconds = 5;
const spinTimeMilliseconds = 3000;
const moneyBuffer = 10*1000*1000;

enum Action {
	UpgradeLevel,
	UpgradeRam,
	UpgradeCores,
	BuyNode
}

class Maximums {
	public static Cores = 16;
	public static Ram = 64;
	public static Level = 200;
}

class ActionSummary {

	constructor(
		public action: Action,
		public targetNode: (number | null),
		public cost: number,
		public gainRate: number) {
	}

	public gainRatePerDollar() {
		return this.gainRate / this.cost;
	}
}

/** @param {NS} ns **/
export async function main(ns: NS) {
	await optimize(ns, breakEvenTimeSeconds);
}

async function waitForMoney(ns: NS, action: ActionSummary): Promise<void> {
	while (hacknetFunds(ns) < action.cost) {
		await ns.sleep(spinTimeMilliseconds);
	}
}

async function optimize(ns: NS, breakEvenTimeSeconds: number) {
	while (true) {
		const optimal = findOptimalAction(ns);
		if (optimal === null) {
			ns.tprint(`Found no optimal actions to perform.`);
			break;
		}

		if (optimal.gainRate * breakEvenTimeSeconds > optimal.cost) {
			await waitForMoney(ns, optimal);
			performAction(ns, optimal);
			await ns.sleep(timeBetweenActionsMilliseconds);
		}
		else {
			ns.tprint(`No actions available at the target gain rate.`);
			break;
		}
	}
}

function performAction(ns: NS, action: ActionSummary) {
	if (action.action === Action.BuyNode) {
		ns.tprint(`Purchasing node for $${action.cost}...`);
		ns.hacknet.purchaseNode();
	}
	else if (action.action === Action.UpgradeLevel) {
		const current = ns.hacknet.getNodeStats(<number>action.targetNode).level;
		ns.tprint(`Upgrading level of node ${action.targetNode} for $${action.cost} from ${current}...`);
		ns.hacknet.upgradeLevel(<number>action.targetNode, 1);
	}
	else if (action.action === Action.UpgradeCores) {
		const current = ns.hacknet.getNodeStats(<number>action.targetNode).cores;
		ns.tprint(`Upgrading cores of node ${action.targetNode} for $${action.cost} from ${current}...`);
		ns.hacknet.upgradeCore(<number>action.targetNode, 1);
	}
	else if (action.action === Action.UpgradeRam) {
		const current = ns.hacknet.getNodeStats(<number>action.targetNode).ram;
		ns.tprint(`Upgrading RAM of node ${action.targetNode} for $${action.cost} from ${current}...`);
		ns.hacknet.upgradeRam(<number>action.targetNode, 1);
	}
	else {
		throw `Unrecognized action ${action.action}`;
	}
}

function findOptimalAction(ns: NS): (ActionSummary | null) {
	const availableActions: Array<Action> = [
		Action.BuyNode,
		Action.UpgradeCores,
		Action.UpgradeLevel,
		Action.UpgradeRam
	];

	const summaries = <Array<ActionSummary>>availableActions.map(a => getSummaryForAction(ns, a)).filter(a => a !== null);

	const ordered = orderByDescending(summaries, s => s.gainRatePerDollar());

	if (ordered.length > 0) {
		return ordered[0];
	}

	return null;
}

function getSummaryForAction(ns: NS, action: Action): (ActionSummary | null) {
	if (action === Action.BuyNode) {
		return getSummaryForBuyNode(ns);
	}
	else if (action === Action.UpgradeLevel) {
		return getSummaryForUpgradeLevel(ns);
	}
	else if (action === Action.UpgradeCores) {
		return getSummaryForUpgradeCores(ns);
	}
	else if (action === Action.UpgradeRam) {
		return getSummaryForUpgradeRam(ns);
	}
	else {
		throw `Unrecognized action ${action}`;
	}
}

function getSummaryForBuyNode(ns: NS): (ActionSummary | null) {
	if (ns.hacknet.maxNumNodes() === ns.hacknet.numNodes()) {
		return null;
	}

	return new ActionSummary(
		Action.BuyNode, 
		null, 
		ns.hacknet.getPurchaseNodeCost(), 
		ns.formulas.hacknetNodes.moneyGainRate(1, 1, 1)
	);
}

function getSummaryForUpgradeLevel(ns: NS): (ActionSummary | null) {
	return getSummaryGeneric(
		ns,
		Action.UpgradeLevel,
		node => node.level === Maximums.Level,
		node => ns.formulas.hacknetNodes.levelUpgradeCost(node.level, 1),
		node => {
			const oldRate = ns.formulas.hacknetNodes.moneyGainRate(node.level, node.ram, node.cores);
			const newRate = ns.formulas.hacknetNodes.moneyGainRate(node.level+1, node.ram, node.cores);

			return newRate / oldRate;
		}
	);
}

function getSummaryForUpgradeCores(ns: NS): (ActionSummary | null) {
	return getSummaryGeneric(
		ns,
		Action.UpgradeCores,
		node => node.cores === Maximums.Cores,
		node => ns.formulas.hacknetNodes.coreUpgradeCost(node.cores, 1),
		node => {
			const oldRate = ns.formulas.hacknetNodes.moneyGainRate(node.level, node.ram, node.cores);
			const newRate = ns.formulas.hacknetNodes.moneyGainRate(node.level, node.ram, node.cores+1);

			return newRate / oldRate;
		}
	);
}

function getSummaryForUpgradeRam(ns: NS): (ActionSummary | null) {
	return getSummaryGeneric(
		ns,
		Action.UpgradeRam,
		node => node.ram === Maximums.Ram,
		node => ns.formulas.hacknetNodes.ramUpgradeCost(node.ram, 1),
		node => {
			const oldRate = ns.formulas.hacknetNodes.moneyGainRate(node.level, node.ram, node.cores);
			const newRate = ns.formulas.hacknetNodes.moneyGainRate(node.level, node.ram*2, node.cores);

			return newRate / oldRate;
		}
	);
}

function getSummaryGeneric(
		ns: NS, 
		action: Action,
		isMaxed: (node: NodeStats) => boolean,
		getCost: (node: NodeStats) => number,
		getRate: (node: NodeStats) => number): (ActionSummary | null) {
	let optimalAction: (ActionSummary | null) = null;

	for (let i=0; i<ns.hacknet.numNodes(); i++) {
		const currentNode = ns.hacknet.getNodeStats(i);
		if (isMaxed(currentNode)) {
			continue;
		}

		const cost = getCost(currentNode);
		const rate = getRate(currentNode);

		const currentSummary = new ActionSummary(
			action,
			i,
			cost, 
			rate
		);

		if (optimalAction === null) {
			optimalAction = currentSummary;
		}
		else {
			if (optimalAction.gainRatePerDollar() < currentSummary.gainRatePerDollar()) {
				optimalAction = currentSummary;
			}
		}
	}

	return optimalAction;
}
 
function hacknetFunds(ns: NS) {
	return Math.max(ns.getServerMoneyAvailable(ServerNames.Home) - moneyBuffer, 0);
}