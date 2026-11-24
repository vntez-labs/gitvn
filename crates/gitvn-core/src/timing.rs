// Compiled only for benchmarks. Each clock interval measures one pipeline stage.
use crate::{anti_abuse, models::InputError, normalization, scoring, Request};
use serde::Serialize;

#[derive(Default, Serialize)]
pub struct Timings {
    pub decode: f64,
    pub normalization: f64,
    pub anti_abuse: f64,
    pub scoring: f64,
    pub encode: f64,
    pub end_to_end: f64,
}

pub fn profile(input: &[u8], now: impl Fn() -> f64) -> Result<(Vec<u8>, Timings), InputError> {
    let start = now();
    let request = Request::decode(input)?;
    let decoded = now();
    let config = request.config();
    scoring::validate_config(config)?;
    let normalized = normalization::normalize(&request.snapshot)?;
    let normalized_at = now();
    let adjusted = anti_abuse::adjust(&normalized, config);
    let adjusted_at = now();
    let result = scoring::calculate(&normalized, adjusted, config);
    let scored_at = now();
    let bytes = serde_json::to_vec(&result).map_err(|_| InputError::Encode)?;
    let encoded = now();
    drop(normalized);
    drop(request);
    Ok((
        bytes,
        Timings {
            decode: decoded - start,
            normalization: normalized_at - decoded,
            anti_abuse: adjusted_at - normalized_at,
            scoring: scored_at - adjusted_at,
            encode: encoded - scored_at,
            end_to_end: now() - start,
        },
    ))
}
