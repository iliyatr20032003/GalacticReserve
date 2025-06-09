use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() != 3 {
        eprintln!("Usage: {} <multiplier> <amount>", args[0]);
        return;
    }
    let mult: f64 = args[1].parse().expect("multiplier");
    let amount: f64 = args[2].parse().expect("amount");
    let year1 = amount * mult;
    let year2 = year1 * mult;
    println!("Initial: {:.2}", amount);
    println!("Year 1: {:.2}", year1);
    println!("Year 2: {:.2}", year2);
}
