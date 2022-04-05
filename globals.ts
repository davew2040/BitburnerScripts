
export class ServerNames {
    public static Home = "home";
}

class ScriptNames {
    public Grow = "grow.js";
    public Weaken = "weaken.js";
    public Hack = "hack.js";
    public HackByPercentage = "hack-percentage.js";
}

export class Ports {
    public static LogsGrow = 1;
    public static LogsWeaken = 2;
    public static LogsHack = 3;
}

export class LogFiles {
    public static LogsGrow = "grow.log.txt";
    public static LogsHack = "hack.log.txt";
    public static LogsWeaken = "weaken.log.txt";
}

export class Costs {
    public static weakenSecurityReductionPerThread = 0.05;
    public static growSecurityCostPerThread = 0.004;
    public static hackSecurityCostPerThread = 0.002;
}

export const MyScriptNames = new ScriptNames();