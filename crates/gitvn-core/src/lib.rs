pub mod anti_abuse;
pub mod models;
pub mod normalization;
mod roles;
pub mod scoring;
#[cfg(feature = "benchmark")]
pub mod timing;

#[cfg(target_arch = "wasm32")]
mod wasm;

use models::{Config, InputError, ScoreResult, Snapshot};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Request {
    pub snapshot: Snapshot,
    pub config: Option<Config>,
}

impl Request {
    pub fn decode(input: &[u8]) -> Result<Self, InputError> {
        serde_json::from_slice(input).map_err(|_| InputError::Decode)
    }

    pub fn config(&self) -> &Config {
        match &self.config {
            Some(config) => config,
            None => scoring::default_config(),
        }
    }
}

pub fn score(snapshot: &Snapshot, config: &Config) -> Result<ScoreResult, InputError> {
    scoring::validate_config(config)?;
    let normalized = normalization::normalize(snapshot)?;
    let adjusted = anti_abuse::adjust(&normalized, config);
    Ok(scoring::calculate(&normalized, adjusted, config))
}

pub fn score_json(input: &[u8]) -> Result<Vec<u8>, InputError> {
    let request = Request::decode(input)?;
    let result = score(&request.snapshot, request.config())?;
    serde_json::to_vec(&result).map_err(|_| InputError::Encode)
}
