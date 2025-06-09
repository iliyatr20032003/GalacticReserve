use rand::seq::{SliceRandom, IteratorRandom};
use rand::thread_rng;
use std::io::{self, Write};

#[derive(Clone, Copy)]
struct Card(u8);

impl std::fmt::Display for Card {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

const LINES: [[usize;3];8] = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
];

fn check_win(board: &[Option<(u8,u8)>], last: usize) -> bool {
    for line in LINES.iter() {
        if line.contains(&last) {
            if let [Some((p1,v1)), Some((p2,v2)), Some((p3,v3))] = [board[line[0]], board[line[1]], board[line[2]]] {
                if p1 == p2 && p2 == p3 && v1 + v2 + v3 == 21 { return true; }
            }
        }
    }
    false
}

fn main() {
    let mut deck: Vec<u8> = (1..=11).flat_map(|v| std::iter::repeat(v).take(4)).collect();
    deck.shuffle(&mut thread_rng());
    let mut deck_iter = deck.into_iter();
    let mut hands = vec![Vec::new(), Vec::new()];
    for _ in 0..5 { for h in hands.iter_mut() { h.push(deck_iter.next().unwrap()); } }
    let mut board: Vec<Option<(u8,u8)>> = vec![None;9];
    let mut current = 0u8;
    loop {
        println!("Board:");
        for i in 0..9 {
            if i%3==0 && i!=0 { println!(); }
            match board[i] {
                Some((p,v)) => print!("{}{} ", if p==0 { 'A' } else { 'B' }, v),
                None => print!("{}  ", i+1),
            }
        }
        println!();
        if board.iter().all(|c| c.is_some()) { println!("Draw"); break; }
        if current==0 {
            println!("Your hand:");
            for (i,c) in hands[0].iter().enumerate() { print!("{}:{} ", i+1, c); }
            println!();
            print!("Select card index and board position (e.g., 1 5): ");
            io::stdout().flush().unwrap();
            let mut input=String::new();
            io::stdin().read_line(&mut input).unwrap();
            let parts: Vec<_>=input.split_whitespace().collect();
            if parts.len()!=2 {println!("Invalid input"); continue; }
            let ci:usize=match parts[0].parse::<usize>(){Ok(v)=>v-1,Err(_)=>{println!("Invalid");continue}};
            let pos:usize=match parts[1].parse::<usize>(){Ok(v)=>v-1,Err(_)=>{println!("Invalid");continue}};
            if ci>=hands[0].len() || pos>=9 || board[pos].is_some(){println!("Invalid"); continue;}
            let card=hands[0].remove(ci);
            board[pos]=Some((0,card));
            if check_win(&board,pos){println!("You win!");break;}
        } else {
            // simple AI random
            let pos = (0..9).filter(|&i| board[i].is_none()).choose(&mut thread_rng()).unwrap();
            let ci = 0;
            let card = hands[1].remove(ci);
            board[pos]=Some((1,card));
            println!("AI plays {} at {}", card, pos+1);
            if check_win(&board,pos){println!("AI wins!");break;}
        }
        if board.iter().all(|c| c.is_some()) { println!("Draw"); break; }
        current^=1;
        if hands[current as usize].is_empty() { if let Some(c)=deck_iter.next(){ hands[current as usize].push(c); } }
    }
}
