
export class ServerNames {
    public static Home = "home";
    public static Noodles = "n00dles";
    public static FoodNStuff = "foodnstuff";
    public static JoesGuns = "joesguns";
    public static HarakiriSushi = "harakiri-sushi";
    public static IronGym = "harakiri-sushi";
    public static MaxHardware = "max-hardware"; 
    public static SigmaCosmetics = "sigma-cosmetics";
    public static HongFangTea = "hong-fang-tea";
}

class ScriptNames {
    public AddOverview = "add-overview.js";
    public Crime = "crime.js";
    public Grow = "grow.js";
    public Weaken = "weaken.js";
    public Hack = "hack.js";
    public HackByPercentage = "hack-percentage.js";
    public LogCollect = "log-collect.js";
    public LogPrune = "log-prune.js";
    public ManageGangs = "manage-gangs.js";
    public FactionGain = "faction-gain.js";
    public PortLogger = "port-logger.js";
    public Share = "share.js";
    public KillScripts = "kill-scripts.js";
    public ProcessLaunchers = "process-launchers.js";
    public UniqueGenerator = "unique-generator.js";
    public SetupHosts = "setup-hosts.js";
    public SmallHack = "small-hack.js";
    public SpinHackLevel = "spin-hack-level.js";

    public HackByPercentageSingle = "hack-percentage-single.js";
    public HackByPercentagePart = "hack-percentage-part.js";
    public HackByPercentageSet = "hack-percentage-set.js";
    public Prepare = "prepare.js";

    public MinimalGrow = "minimal-grow.js";
    public MinimalWeaken = "minimal-weaken.js";
    public MinimalHack = "minimal-hack.js";
}

export class Factions {
    public static Aevum = 'Aevum';
    public static CyberSec = 'CyberSec';
    public static TheBlackHand = 'The Black Hand';
}

export class WorkTypes {
    public static HackingContracts = 'Hacking Contracts';
}

export class Ports {
    public static GenericLogger = 1;
    public static HackMessageQueue = 2;
}

export class LogFiles {
    public static LogsDefault = "log.default.txt";
    public static LogsGrow = "log.grow.txt";
    public static LogsHack = "log.hack.txt";
    public static LogsWeaken = "log.weaken.txt";
    public static LogsTemp = "log.temp.txt";
    public static LogsError = "log.error.txt";
}

export class Costs {
    public static weakenSecurityReductionPerThread = 0.05;
    public static growSecurityCostPerThread = 0.004;
    public static hackSecurityCostPerThread = 0.002;
}

export const MyScriptNames = new ScriptNames();