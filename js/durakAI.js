const DurakAI = (() => {
    let difficulty = 'normal';

    function setDifficulty(level) {
        difficulty = level || 'normal';
    }

    function chooseAttack(state, playerIndex) {
        const hand = state.players[playerIndex].hand;
        const options = DurakEngine.getLegalAttacks(hand, state.table);
        if (options.length === 0) return null;
        options.sort((a,b)=>rankValue(a,state.trump)-rankValue(b,state.trump));

        if (difficulty === 'easy') {
            if (Math.random() < 0.7) return options[0];
            return options[Math.floor(Math.random()*options.length)];
        }

        if (difficulty === 'hard') {
            const nonTrump = options.filter(c => c.suit !== state.trump);
            if (nonTrump.length > 0) return nonTrump[0];
        }

        return options[0];
    }

    function chooseDefence(state, cardToBeat, playerIndex) {
        const hand = state.players[playerIndex].hand;
        const options = DurakEngine.getLegalDefences(cardToBeat, hand, state.trump);
        if (options.length === 0) return null;
        options.sort((a,b)=>rankValue(a,state.trump)-rankValue(b,state.trump));

        if (difficulty === 'easy') {
            if (Math.random() < 0.7) return options[0];
            return options[Math.floor(Math.random()*options.length)];
        }

        if (difficulty === 'hard') {
            const sameSuit = options.filter(c => c.suit === cardToBeat.suit);
            if (sameSuit.length > 0) return sameSuit[0];
        }

        return options[0];
    }

    function rankValue(card, trump) {
        const ranks = ['6','7','8','9','10','J','Q','K','A'];
        return ranks.indexOf(card.rank) + (card.suit === trump ? 100 : 0);
    }

    return { chooseAttack, chooseDefence, setDifficulty };
})();
