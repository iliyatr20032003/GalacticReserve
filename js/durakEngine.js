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

    function createGame() {
        const deck = createDeck();
        shuffle(deck);
        const players = [{id:0, hand:deal(deck,6)}, {id:1, hand:deal(deck,6)}];
        const trump = deck[deck.length - 1].suit;
        return {
            players,
            stock: deck,
            trump,
            table: [],
            attacker: 0,
            defender: 1,
            discard: []
        };
    }

    function draw(state, playerIndex) {
        while (state.players[playerIndex].hand.length < 6 && state.stock.length > 0) {
            state.players[playerIndex].hand.push(state.stock.shift());
        }
    }

    function rotateRoles(state, successfulDefence) {
        if (successfulDefence) {
            const a = state.attacker;
            state.attacker = state.defender;
            state.defender = (a + 1) % state.players.length;
        } else {
            state.attacker = state.attacker;
            state.defender = (state.defender + 1) % state.players.length;
        }
    }

    function endTurn(state, successfulDefence) {
        if (successfulDefence) {
            state.discard.push(...state.table.flatMap(p => [p.attack, p.defence]));
        } else {
            state.players[state.defender].hand.push(...state.table.flatMap(p => [p.attack].concat(p.defence ? [p.defence] : [])));
        }
        state.table = [];
        draw(state, state.attacker);
        draw(state, state.defender);
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
