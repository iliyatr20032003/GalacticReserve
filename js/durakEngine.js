const DurakEngine = (() => {
    const ranks = ['6','7','8','9','10','J','Q','K','A'];
    const suits = ['\u2660','\u2665','\u2666','\u2663'];

    function createDeck() {
        const deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({rank, suit});
            }
        }
        return deck;
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function deal(deck, count) {
        return deck.splice(0, count);
    }

    function beats(card, target, trump) {
        if (card.suit === target.suit && rankIndex(card) > rankIndex(target)) return true;
        if (card.suit === trump && target.suit !== trump) return true;
        if (card.suit === trump && target.suit === trump && rankIndex(card) > rankIndex(target)) return true;
        return false;
    }

    function rankIndex(card) {
        return ranks.indexOf(card.rank);
    }

    function getLegalDefences(cardToBeat, hand, trump) {
        return hand.filter(c => beats(c, cardToBeat, trump));
    }

    function getLegalAttacks(hand, table) {
        if (table.length === 0) return hand.slice();
        const ranksOnTable = new Set();
        table.forEach(p => {
            ranksOnTable.add(p.attack.rank);
            if (p.defence) ranksOnTable.add(p.defence.rank);
        });
        return hand.filter(c => ranksOnTable.has(c.rank));
    }

    function findLowestTrumpPlayer(players, trump) {
        let lowest = Infinity;
        let idx = 0;
        players.forEach((player, i) => {
            player.hand.forEach(card => {
                if (card.suit === trump && rankIndex(card) < lowest) {
                    lowest = rankIndex(card);
                    idx = i;
                }
            });
        });
        return idx;
    }

    function createGame() {
        const deck = createDeck();
        shuffle(deck);
        const players = [{id:0, hand:deal(deck,6)}, {id:1, hand:deal(deck,6)}];
        const trumpCard = deck.pop();
        const attacker = findLowestTrumpPlayer(players, trumpCard.suit);
        const defender = (attacker + 1) % players.length;
        return {
            players,
            stock: deck,
            trump: trumpCard.suit,
            trumpCard,
            table: [],
            attacker,
            defender,
            discard: []
        };
    }

    function draw(state, playerIndex) {
        while (state.players[playerIndex].hand.length < 6) {
            if (state.stock.length > 0) {
                state.players[playerIndex].hand.push(state.stock.shift());
            } else if (state.trumpCard) {
                state.players[playerIndex].hand.push(state.trumpCard);
                state.trumpCard = null;
            } else {
                break;
            }
        }
    }

    // Draw cards for each player starting with the attacker and ending with
    // the defender. This mirrors the real-life rule that the defender refills
    // their hand last.
    function refillPlayers(state) {
        let index = state.attacker;
        while (true) {
            draw(state, index);
            if (index === state.defender) break;
            index = (index + 1) % state.players.length;
        }
    }

    function rotateRoles(state, successfulDefence) {
        if (successfulDefence) {
            // Defender becomes the next attacker and the new defender is the
            // player to their left
            state.attacker = state.defender;
            state.defender = (state.attacker + 1) % state.players.length;
        } else {
            // Defender picked up; attack passes to the player on the defender's left
            state.attacker = (state.defender + 1) % state.players.length;
            state.defender = (state.attacker + 1) % state.players.length;
        }
    }

    function endTurn(state, successfulDefence) {
        if (successfulDefence) {
            state.discard.push(...state.table.flatMap(p => [p.attack, p.defence]));
        } else {
            state.players[state.defender].hand.push(...state.table.flatMap(p => [p.attack].concat(p.defence ? [p.defence] : [])));
        }
        state.table = [];
        refillPlayers(state);
        rotateRoles(state, successfulDefence);
    }

    return {
        createGame,
        getLegalDefences,
        getLegalAttacks,
        beats,
        endTurn
    };
})();
