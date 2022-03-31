
export class TargetsConfiguration {
	public map = new Map<string, SingleTargetConfiguration>();

	/** 
	 * 	@param {string} targetName 
	 * 	@param {OperationProportions} config 
	 **/
	add(targetName: string, config: SingleTargetConfiguration): void {
        this.map.set(targetName, config);
	}
}

export class SingleTargetConfiguration {
    public proportions: OperationProportions;
    public threads: number;

    constructor(proportions: OperationProportions, threads: number) {
        this.proportions = proportions;
        this.threads = threads;
    }
}

export class OperationProportions {
	public weaken = 0;
	public grow = 0; 
	public hack = 0;

	get total(): number {
		return this.weaken + this.grow + this.hack;
	}

	constructor(weaken: number, grow: number, hack: number) {
		this.weaken = weaken;
		this.grow = grow;
		this.hack = hack;
	}
}

export class RunningProcessSummary {
    public grow = 0;
    public weaken = 0;
    public hack = 0;

	public get total(): number {
		return this.grow + this.weaken + this.hack;
	}
}