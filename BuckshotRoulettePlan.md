# Buckshot Roulette Project Plan

*(draft for HTML5 version inspired by Mike Klubnika's game)*

## 1. Game Overview *(partially implemented)*
Buckshot Roulette is a horror-themed variant of Russian roulette played with a shotgun. The goal is to survive three consecutive rounds while reducing opponents to zero charges (HP). The browser version should support both single-player (against an AI Dealer) and multiplayer (up to four players).

## 2. Round Structure *(partially implemented – rounds and bank now tracked)*
Each round goes through several phases:

| Phase | Description | Browser Considerations |
|-------|-------------|------------------------|
| **Item phase** | Each participant receives 2–5 random items (max 8 slots). | Inventory UI with drag&drop or "use" button. *(partially)* |
| **Health phase** | Overall HP for the round (2–4) is shown via a pulse meter. | Track `maxCharges` and `currentCharges` for all players. *(fully implemented)* |
| **Loading phase** | Dealer displays 2–8 shells then shuffles them. If even: half live, half blank. If odd: difference exactly 1. | Function `generateLoad(size)` implements distribution. *(fully)* |
| **Main phase** | Players take turns. On their turn they may use items, then fire the shotgun at themselves or a target. A blank self-shot keeps the turn, anything else ends it. | Finite-state machine (PlayerTurn → DealerTurn → …) with life checks and automatic reload when magazine empty. *(partially)* |

The round ends when a player’s HP reaches 0 or the magazine is empty. Winning three rounds ends Story mode; in Double or Nothing players may continue for double the money.

## 3. Items
### 3.1 Basic items *(fully implemented)*
| Item | Effect |
|------|--------|
| **Cigarette Pack** | +1 HP. *(fully implemented)* |
| **Handcuffs** | Opponent skips next turn. *(fully implemented)* |
| **Magnifying Glass** | Reveals whether current shell is live or blank. *(fully implemented)* |
| **Beer** | Discards the current shell. *(fully implemented)* |
| **Hand Saw** | Shotgun deals x2 damage for the rest of the turn. *(fully implemented)* |

### 3.2 Double or Nothing + Multiplayer only
| Item | Effect |
|------|--------|
| **Adrenaline** | Steal an item from another player and use it immediately. *(fully implemented)* |
| **Burner Phone** | Reveals type and position of a random future shell. *(fully implemented)* |
| **Inverter** | Converts current shell: blank ↔ live. *(fully implemented)* |
| **Expired Medicine** | 50% chance +2 HP, 50% chance −1 HP. *(fully implemented)* |
These items appear only in Double or Nothing mode.
Double or Nothing is enabled by default so these items normally appear.

### 3.3 Multiplayer only
| Item | Effect |
|------|--------|
| **Jammer** | Targeted player skips turn. |
| **Remote** | Reverses turn order. |

## 4. Shell Generation *(fully implemented)*
The shotgun magazine size ranges 2–8 with at least one live and one blank. Algorithm:
```text
if even: lives = blanks = size/2
else: |lives − blanks| = 1, lives + blanks = size
```
Magazine is always shuffled on reload.

## 5. Dealer AI *(partially implemented – basic rules working)*
The single-player Dealer follows deterministic rules:
- Uses **Magnifying Glass** when the shell is unknown.
- Uses **Inverter** if facing a blank and wants to attack.
- Uses **Handcuffs** whenever available.
- Uses **Adrenaline** to steal useful items it lacks (e.g., Cigarette Pack). *(implemented)*
- Fires a blank at themselves when it’s a safe pass.
- Uses **Hand Saw** before attacking for double damage.

Implement as a simple rule-based finite-state machine that tracks known shells and processes the above rules in order.

## 6. Architecture Notes *(partially implemented)*
### Core Entities
- `GameState` – mode, phase, round, bank, player order.
- `Player` – id, name, hp, inventory[]
- `Shell` – enum `{ LIVE, BLANK }`
- `Shotgun` – `magazine: Shell[]`, `indexChamber`
- `Item` – type, `effect()`, mode restriction

### State Machine
```
stateDiagram
  [*] --> ItemPhase
  ItemPhase --> HealthPhase : if newRound
  HealthPhase --> LoadingPhase
  LoadingPhase --> PlayerTurn
  PlayerTurn --> DealerTurn : afterShot
  DealerTurn --> PlayerTurn : afterShot
  PlayerTurn --> ItemPhase : magazineEmpty
  DealerTurn --> ItemPhase : magazineEmpty
  PlayerTurn --> EndRound : hp<=0
  DealerTurn --> EndRound : hp<=0
  EndRound --> ItemPhase : nextRound
  EndRound --> GameEnd : storyFinished / playerDead
```

### UI Layout
- A virtual table with zones for the shotgun, magazine (showing known shell types), and item slots under each player.
- Use CSS keyframes or WebGL sprites for animations with adjustable delays so players have time to read.
- For multiplayer, employ WebSocket or WebRTC.

### Configurable Parameters (store in JSON)
```json
{
  "hpOptions": [2,3,4],
  "itemSlots": 8,
  "itemPerRound": [2,5],
  "maxShells": 8,
  "minShells": 2
}
```

## 7. Additional Features
- Colorblind filter to distinguish shell types. *(fully implemented)*
- Adjustable animation speed (0.5×–2×). *(fully implemented)*
- Option to save RNG seed for replays and debugging. *(fully implemented)*
- Settings modal to toggle colorblind mode and enter RNG seed. *(fully implemented)*
- Toggle for Double or Nothing mode enabling Inverter and Expired Medicine (on by default). *(fully implemented)*
- Modding API (original uses Godot mods).
- Scoring: Story uses time and leftover HP as money. Double or Nothing doubles the bank every three rounds; leaderboard via REST API. *(partially implemented – bank and round counter)*

This plan captures the rules, phases, items, AI logic, and architecture necessary to prototype an HTML5 version of **Buckshot Roulette**.

## File Locations *(fully documented)*
- `pages/buckshot.html` – main game page
- `js/buckshot.js` – game logic
- `css/buckshot.css` – styles for Buckshot Roulette
