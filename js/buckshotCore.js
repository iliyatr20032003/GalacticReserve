/**
 * Buckshot Roulette core logic
 * @module buckshotCore
 */

/**
 * Types of shotgun shells.
 * @readonly
 * @enum {string}
 */
const ShellType = Object.freeze({
    LIVE: 'LIVE',
    BLANK: 'BLANK'
});

/**
 * Shotgun shell data structure.
 * @class
 */
class Shell {
    /**
     * @param {ShellType} [type=ShellType.BLANK] shell type
     */
    constructor(type = ShellType.BLANK) {
        /** @type {ShellType} */
        this.type = type;
    }
}

/**
 * Shotgun container with magazine.
 * @class
 */
class Shotgun {
    constructor() {
        /** @type {Shell[]} */
        this.magazine = [];
        /** @type {boolean} indicates double damage for next live shell */
        this.barrelMod = false;
    }
}

/**
 * Game phases.
 * @readonly
 * @enum {string}
 */
const Phase = Object.freeze({
    ITEMS: 'ITEMS',
    HEALTH: 'HEALTH',
    LOAD: 'LOAD',
    MAIN: 'MAIN'
});

/**
 * Encapsulates the full game state.
 * @class
 */
class GameState {
    /**
     * @param {Object} param0 initial data
     * @param {Phase} [param0.phase]
     * @param {number} [param0.round]
     * @param {number} [param0.turn]
     * @param {Object[]} [param0.players]
     * @param {Shotgun} [param0.shotgun]
     * @param {Function} [param0.rng]
     * @param {number} [param0.streak]
     * @param {boolean} [param0.finished]
     * @param {number} [param0.bank]
     * @param {number[]} [param0.turnOrder]
     */
    constructor({
        phase = Phase.ITEMS,
        round = 1,
        turn = 0,
        players = [],
        shotgun = new Shotgun(),
        rng = 0,
        streak = 0,
        finished = false,
        bank = 0,
        turnOrder = null
    } = {}) {
        this.phase = phase;
        this.round = round;
        this.turn = turn;
        this.players = players;
        this.shotgun = shotgun;
        this.rng = rng;
        this.streak = streak;
        this.finished = finished;
        this.bank = bank;
        this.turnOrder = Array.isArray(turnOrder) ? turnOrder.slice() : null;
    }

    /**
     * Serialize state to a plain object.
     * @returns {Object}
     */
    toJSON() {
        return {
            phase: this.phase,
            round: this.round,
            turn: this.turn,
            players: this.players,
            shotgun: {
                magazine: this.shotgun.magazine.map(s => ({ type: s.type })),
                barrelMod: this.shotgun.barrelMod
            },
            rng: this.rng,
            streak: this.streak,
            finished: this.finished,
            bank: this.bank,
            turnOrder: this.turnOrder
        };
    }

    /**
     * Restore GameState from serialized data.
     * @param {Object|string} obj JSON or object
     * @returns {GameState}
     */
    static fromJSON(obj) {
        if (typeof obj === 'string') {
            obj = JSON.parse(obj);
        }
        const state = new GameState();
        state.phase = obj.phase;
        state.round = obj.round;
        state.turn = obj.turn;
        state.players = obj.players;
        state.shotgun = new Shotgun();
        if (obj.shotgun) {
            state.shotgun.magazine = (obj.shotgun.magazine || []).map(s => new Shell(s.type));
            state.shotgun.barrelMod = !!obj.shotgun.barrelMod;
        }
        state.rng = obj.rng;
        state.streak = obj.streak;
        state.finished = obj.finished;
        state.bank = obj.bank || 0;
        state.turnOrder = Array.isArray(obj.turnOrder) ? obj.turnOrder.slice() : null;
        return state;
    }

    /**
     * Execute one player's turn.
     * @param {Object} actor current player
     * @param {Function} [chooseTargetFn]
     */
    takeTurn(actor, chooseTargetFn = () => actor) {
        if (!this.shotgun.magazine.length) {
            this.phase = Phase.ITEMS;
            return;
        }
        if (actor === this.players[1]) {
            dealerUseItems(this);
        } else {
            useItems(this, actor);
        }
        const shell = this.shotgun.magazine.shift();
        const target = actor; // temporary self-target
        if (shell.type === ShellType.LIVE) {
            target.hp = Math.max(0, (target.hp || 0) - 1);
        }
        this.nextPlayer();
        if (!this.shotgun.magazine.length) {
            this.phase = Phase.ITEMS;
        }
    }

    /**
     * Clear the magazine and update win streaks.
     * @param {Object} winner winning player
     */
    resolveRound(winner) {
        this.shotgun.magazine = [];
        if (winner === this.players[0]) {
            this.streak += 1;
            if (this.streak >= 3) {
                this.finished = true;
            }
        } else {
            this.streak = 0;
            this.bank = 0;
        }
    }

    /**
     * Advance turn order respecting skip flags.
     * @returns {Object} current player
     */
    nextPlayer() {
        if (!Array.isArray(this.turnOrder) || this.turnOrder.length === 0) {
            this.turnOrder = this.players.map((_, i) => i);
        }
        do {
            this.turnOrder.push(this.turnOrder.shift());
            this.turn = this.turnOrder[0];
            const player = this.players[this.turn];
            if (player && player.flags && player.flags.skip) {
                player.flags.skip = false;
            } else {
                break;
            }
        } while (true);
        return this.players[this.turn];
    }
}

/**
 * Choose round health for all players.
 * @param {GameState} state game state
 * @param {Function} [rng=Math.random] random generator
 * @returns {number} chosen hpMax
 */
function setRoundHp(state, rng = Math.random) {
    const hpMax = 2 + Math.floor(rng() * 3); // 2-4 inclusive
    if (Array.isArray(state.players)) {
        state.players.forEach(p => {
            if (p) {
                p.hpMax = hpMax;
                p.hp = hpMax;
            }
        });
    }
    return hpMax;
}

/**
 * Populate the shotgun magazine for a new round.
 * @param {GameState} state
 * @param {Function} [rng=Math.random]
 * @returns {number} number of shells loaded
 */
function loadShotgun(state, rng = Math.random) {
    const magazine = [];
    const count = (Math.floor(rng() * 4) + 1) * 2; // even number 2-8
    magazine.push(new Shell(ShellType.LIVE));
    magazine.push(new Shell(ShellType.BLANK));
    for (let i = 2; i < count; i++) {
        magazine.push(new Shell(rng() < 0.5 ? ShellType.LIVE : ShellType.BLANK));
    }
    for (let i = magazine.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [magazine[i], magazine[j]] = [magazine[j], magazine[i]];
    }
    state.shotgun.magazine = magazine;
    return magazine.length;
}

/** Base class for all items. */
class Item {
    /**
     * Apply item effect.
     * @param {GameState} state
     * @param {Object} owner
     */
    apply(state, owner) {}
}

/** Healing item restoring one HP. */
class CigarettePack extends Item {
    apply(state, owner) {
        if (owner.hp != null && owner.hp < owner.hpMax) {
            owner.hp++;
        }
    }
}

/** Reveals the first shell type to the owner. */
class MagnifyingGlass extends Item {
    apply(state, owner) {
        owner.lastRevealed = state.shotgun.magazine[0]
            ? state.shotgun.magazine[0].type
            : null;
    }
}

/** Heals one HP. */
class Beer extends Item {
    apply(state, owner) {
        if (owner.hp != null && owner.hp < owner.hpMax) {
            owner.hp++;
        }
    }
}

/** Prevents the target's next action. */
class Handcuffs extends Item {
    apply(state, owner) {
        owner.cuffed = true;
    }
}

/** Releases from cuffs at the cost of one HP. */
class Handsaw extends Item {
    apply(state, owner) {
        if (owner.cuffed) {
            owner.cuffed = false;
            owner.hp = Math.max(0, (owner.hp || 0) - 1);
        }
    }
}

/**
 * Apply all items owned by the player.
 * @param {GameState} state
 * @param {Object} owner
 */
function useItems(state, owner) {
    if (owner.items && owner.items.length) {
        owner.items.forEach(it => it.apply(state, owner));
        owner.items = [];
    }
}

/**
 * Steals a random item from the opponent and immediately uses it.
 */
class Adrenaline extends Item {
    apply(state, owner) {
        owner.adrenaline = true;
        const opponent = state.players.find(p => p !== owner && p.items && p.items.length);
        if (opponent) {
            const rngFn = typeof state.rng === 'function' ? state.rng : Math.random;
            const idx = Math.floor(rngFn() * opponent.items.length);
            const [stolen] = opponent.items.splice(idx, 1);
            owner.items = owner.items || [];
            owner.items.push(stolen);
            if (stolen.apply) {
                stolen.apply(state, owner);
            }
        }
    }
}

/** Reveals the last shell in the magazine. */
class Burner extends Item {
    apply(state, owner) {
        owner.burnerUsed = true;
        const idx = state.shotgun.magazine.length - 1;
        if (idx >= 0) {
            owner.peeked = state.shotgun.magazine[idx].type;
        }
    }
}

/** Flips the type of the next shell. */
class Inverter extends Item {
    apply(state, owner) {
        owner.inverted = !owner.inverted;
        if (state.shotgun.magazine.length) {
            const shell = state.shotgun.magazine[0];
            shell.type = shell.type === ShellType.LIVE ? ShellType.BLANK : ShellType.LIVE;
        }
    }
}

/** Randomly heal 2 HP or take 1 damage. */
class ExpiredMedicine extends Item {
    apply(state, owner) {
        const rngFn = typeof state.rng === 'function' ? state.rng : Math.random;
        if (rngFn() < 0.5) {
            if (owner.hp != null) {
                owner.hp = Math.min(owner.hpMax, (owner.hp || 0) + 2);
            }
            owner.medSuccess = true;
        } else {
            if (owner.hp != null) {
                owner.hp = Math.max(0, (owner.hp || 0) - 1);
            }
            owner.medSuccess = false;
        }
    }
}

/** Reverses the current turn order. */
class Remote extends Item {
    apply(state, owner) {
        if (!Array.isArray(state.turnOrder) || state.turnOrder.length === 0) {
            state.turnOrder = state.players.map((_, i) => i);
        }
        const current = state.turnOrder[0];
        const rest = state.turnOrder.slice(1).reverse();
        state.turnOrder = [current, ...rest];
    }
}

/** Skips the target player's next turn. */
class Jammer extends Item {
    constructor(targetIndex = 0) {
        super();
        this.targetIndex = targetIndex;
    }
    apply(state, owner) {
        const target = state.players[this.targetIndex];
        if (target) {
            target.flags = target.flags || {};
            target.flags.skip = true;
        }
    }
}

/**
 * Apply the Double or Nothing decision after a win.
 * @param {GameState} state
 * @param {Function} [decisionFn]
 * @returns {boolean} true if player cashed out
 */
function doubleOrNothing(state, decisionFn = () => false) {
    const continuePlay = decisionFn();
    if (!continuePlay) {
        state.bank += Math.pow(2, state.streak);
        state.streak = 0;
        return true;
    }
    return false;
}

/**
 * Execute dealer AI item usage.
 * @param {GameState} state
 */
function dealerUseItems(state) {
    const dealer = state.players[1];
    if (!dealer || !dealer.items || !dealer.items.length) return;
    const priority = [
        Handcuffs,
        Adrenaline,
        MagnifyingGlass,
        Burner,
        Inverter,
        Beer,
        Handsaw
    ];
    for (const Type of priority) {
        const idx = dealer.items.findIndex(it => it instanceof Type);
        if (idx !== -1) {
            const [item] = dealer.items.splice(idx, 1);
            item.apply(state, dealer);
            break;
        }
    }
}

/**
 * Dealer targeting logic based on first shell.
 * @param {GameState} state
 * @returns {Object}
 */
function dealerChooseTarget(state) {
    const first = state.shotgun.magazine[0];
    if (first && first.type === ShellType.LIVE) {
        return state.players[0];
    }
    return state.players[1];
}

if (typeof module !== 'undefined') {
    const fs = require('fs');
    /**
     * Save game state to a file.
     * @param {GameState} state
     * @param {string} file
     */
    function saveState(state, file) {
        fs.writeFileSync(file, JSON.stringify(state.toJSON()), 'utf8');
    }
    /**
     * Load game state from a file.
     * @param {string} file
     * @returns {GameState}
     */
    function loadState(file) {
        const data = fs.readFileSync(file, 'utf8');
        return GameState.fromJSON(data);
    }
    module.exports = {
        ShellType,
        Shell,
        Shotgun,
        Phase,
        GameState,
        setRoundHp,
        loadShotgun,
        Item,
        CigarettePack,
        MagnifyingGlass,
        Beer,
        Handcuffs,
        Handsaw,
        Adrenaline,
        Burner,
        Inverter,
        ExpiredMedicine,
        Remote,
        Jammer,
        saveState,
        loadState,
        dealerChooseTarget,
        dealerUseItems,
        useItems,
        doubleOrNothing,
        nextPlayer: GameState.prototype.nextPlayer
    };
} else {
    window.ShellType = ShellType;
    window.Shell = Shell;
    window.Shotgun = Shotgun;
    window.Phase = Phase;
    window.GameState = GameState;
    window.setRoundHp = setRoundHp;
    window.loadShotgun = loadShotgun;
    window.Item = Item;
    window.CigarettePack = CigarettePack;
    window.MagnifyingGlass = MagnifyingGlass;
    window.Beer = Beer;
    window.Handcuffs = Handcuffs;
    window.Handsaw = Handsaw;
    window.Adrenaline = Adrenaline;
    window.Burner = Burner;
    window.Inverter = Inverter;
    window.ExpiredMedicine = ExpiredMedicine;
    window.Remote = Remote;
    window.Jammer = Jammer;
    window.saveState = function(state, file) {
        console.warn('saveState is Node-only');
    };
    window.loadState = function(file) {
        console.warn('loadState is Node-only');
    };
    window.dealerChooseTarget = dealerChooseTarget;
    window.dealerUseItems = dealerUseItems;
    window.useItems = useItems;
    window.doubleOrNothing = doubleOrNothing;
    window.nextPlayer = GameState.prototype.nextPlayer;
}
