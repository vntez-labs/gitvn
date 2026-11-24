use gitvn_core::{score_json, timing};
use std::io::{self, Read, Write};
use std::time::Instant;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut bytes = Vec::new();
    io::stdin().read_to_end(&mut bytes)?;
    match std::env::args().nth(1) {
        Some(iterations) => {
            let iterations: usize = iterations.parse()?;
            let origin = Instant::now();
            let mut timings = Vec::with_capacity(iterations);
            for _ in 0..iterations {
                let (_, run) = timing::profile(&bytes, || origin.elapsed().as_secs_f64() * 1000.0)?;
                timings.push(run);
            }
            serde_json::to_writer(io::stdout().lock(), &timings)?;
        }
        None => io::stdout().write_all(&score_json(&bytes)?)?,
    }
    Ok(())
}
