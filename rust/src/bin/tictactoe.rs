use std::io::{self, Write};
use rust::{Cell, Board, check_winner};

fn print_board(board: &Board) {
    for i in 0..9 {
        if i % 3 == 0 && i != 0 {
            println!("\n-+-+-");
        } else if i != 0 {
            print!("|");
        }
        match board[i] {
            Some(c) => print!("{}", c.as_char()),
            None => print!("{}", i + 1),
        }
    }
    println!();
}


fn ai_move(board: &mut Board, symbol: Cell) {
    for i in 0..9 {
        if board[i].is_none() {
            board[i] = Some(symbol);
            return;
        }
    }
}

fn main() {
    let mut board: Board = [None; 9];
    let mut current = Cell::X;
    loop {
        print_board(&board);
        if let Some(w) = check_winner(&board) {
            println!("{} wins!", w.as_char());
            break;
        }
        if board.iter().all(|c| c.is_some()) {
            println!("Draw!");
            break;
        }
        if current == Cell::X {
            print!("Enter move (1-9): ");
            io::stdout().flush().unwrap();
            let mut input = String::new();
            io::stdin().read_line(&mut input).unwrap();
            if let Ok(idx) = input.trim().parse::<usize>() {
                if idx >=1 && idx <=9 && board[idx-1].is_none() {
                    board[idx-1] = Some(Cell::X);
                    current = Cell::O;
                    continue;
                }
            }
            println!("Invalid move");
        } else {
            ai_move(&mut board, Cell::O);
            current = Cell::X;
        }
    }
}
