
export class ServerNames {
    public static Home = "home";
}

class ScriptNames {
    public Grow = "grow.js";
    public Weaken = "weaken.js";
    public Hack = "hack.js";
    public HackByPercentage = "hack-percentage.js";
    public LogCollect = "log-collect.js";
    public LogPrune = "log-prune.js";
}

export class Ports {
    public static GenericLogger = 1;
}

export class LogFiles {
    public static LogsDefault = "log.default.txt";
    public static LogsGrow = "log.grow.txt";
    public static LogsHack = "log.hack.txt";
    public static LogsWeaken = "log.weaken.txt";
}

export class Costs {
    public static weakenSecurityReductionPerThread = 0.05;
    public static growSecurityCostPerThread = 0.004;
    public static hackSecurityCostPerThread = 0.002;
}

export const MyScriptNames = new ScriptNames();