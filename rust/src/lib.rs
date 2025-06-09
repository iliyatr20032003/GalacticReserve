#[derive(Clone, Copy, PartialEq)]
pub enum Cell {
    X,
    O,
}

impl Cell {
    pub fn as_char(self) -> char {
        match self {
            Cell::X => 'X',
            Cell::O => 'O',
        }
    }
}

pub type Board = [Option<Cell>; 9];

pub fn check_winner(board: &Board) -> Option<Cell> {
    let wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6],
    ];
    for line in wins.iter() {
        if let (Some(a), Some(b), Some(c)) = (board[line[0]], board[line[1]], board[line[2]]) {
            if a == b && b == c {
                return Some(a);
            }
        }
    }
    None
}

#[derive(Clone, Copy)]
pub struct Card {
    pub value: u8,
    pub suit: char,
}

pub fn card_value(card: Card) -> u8 {
    if card.value > 10 { 10 } else { card.value }
}

pub fn hand_value(hand: &[Card]) -> u8 {
    let mut total = 0;
    let mut aces = 0;
    for &c in hand {
        if c.value == 1 {
            aces += 1;
        } else {
            total += card_value(c);
        }
    }
    for _ in 0..aces {
        if total + 11 <= 21 {
            total += 11;
        } else {
            total += 1;
        }
    }
    total
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tictactoe_winner_rows() {
        let b = [Some(Cell::X), Some(Cell::X), Some(Cell::X), None, None, None, None, None, None];
        assert_eq!(check_winner(&b), Some(Cell::X));
    }

    #[test]
    fn blackjack_hand_value() {
        let hand = [Card{value:1, suit:'S'}, Card{value:13, suit:'H'}];
        assert_eq!(hand_value(&hand), 21);
    }
}
