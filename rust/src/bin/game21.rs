use rand::seq::SliceRandom;
use rand::thread_rng;
use std::io::{self, Write};
use rust::{Card, hand_value};

fn create_deck() -> Vec<Card> {
    let suits = ['\u{2660}', '\u{2665}', '\u{2666}', '\u{2663}'];
    let mut deck = Vec::new();
    for value in 1..=13 {
        for &s in &suits {
            deck.push(Card { value, suit: s });
        }
    }
    deck
}

fn label(card: Card) -> String {
    let labels = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    format!("{}{}", labels[(card.value - 1) as usize], card.suit)
}

fn print_hand(name: &str, hand: &[Card]) {
    let labels: Vec<String> = hand.iter().map(|&c| label(c)).collect();
    println!("{}: {} ({})", name, labels.join(" "), hand_value(hand));
}

fn main() {
    let mut deck = create_deck();
    deck.shuffle(&mut thread_rng());
    let mut deck_iter = deck.into_iter();

    let mut player = vec![deck_iter.next().unwrap(), deck_iter.next().unwrap()];
    let mut dealer = vec![deck_iter.next().unwrap()];

    loop {
        print_hand("Dealer", &dealer);
        print_hand("Player", &player);

        if hand_value(&player) > 21 {
            println!("Bust! Dealer wins");
            return;
        }

        print!("Hit or stand (h/s)? ");
        io::stdout().flush().unwrap();
        let mut choice = String::new();
        io::stdin().read_line(&mut choice).unwrap();
        match choice.trim() {
            "h" | "hit" => {
                if let Some(card) = deck_iter.next() {
                    player.push(card);
                }
            }
            "s" | "stand" => break,
            _ => println!("Invalid choice"),
        }
    }

    while hand_value(&dealer) < 17 {
        if let Some(card) = deck_iter.next() {
            dealer.push(card);
        }
    }

    print_hand("Dealer", &dealer);
    print_hand("Player", &player);

    let ps = hand_value(&player);
    let ds = hand_value(&dealer);
    if ds > 21 || ps > ds {
        println!("You win!");
    } else if ds == ps {
        println!("Draw!");
    } else {
        println!("Dealer wins!");
    }
}
