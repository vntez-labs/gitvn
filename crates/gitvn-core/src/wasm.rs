// JSON is transferred once in each direction. The host writes and reads exported
// linear memory only between calls. Vec ownership stays inside the Rust instance.
use crate::{models::InputError, score_json};
use std::cell::RefCell;

const MAX_INPUT: usize = 256 * 1024 * 1024;
thread_local! {
    static INPUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
    static OUTPUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
}

#[no_mangle]
pub extern "C" fn prepare_input(length: usize) -> *mut u8 {
    INPUT.with(|input| {
        let mut input = input.borrow_mut();
        input.clear();
        if length == 0 || length > MAX_INPUT || input.try_reserve_exact(length).is_err() {
            return std::ptr::null_mut();
        }
        input.resize(length, 0);
        input.as_mut_ptr()
    })
}

#[no_mangle]
pub extern "C" fn score_input() -> *const u8 {
    let result = INPUT.with(|input| {
        let input = input.borrow();
        if input.is_empty() {
            Err(InputError::Buffer)
        } else {
            score_json(&input)
        }
    });
    OUTPUT.with(|output| {
        let mut output = output.borrow_mut();
        *output = match result {
            Ok(bytes) => bytes,
            Err(error) => serde_json::to_vec(&serde_json::json!({ "error": error }))
                .expect("error response is serializable"),
        };
        output.as_ptr()
    })
}

#[no_mangle]
pub extern "C" fn output_length() -> usize {
    OUTPUT.with(|output| output.borrow().len())
}

#[no_mangle]
pub extern "C" fn release_buffers() {
    INPUT.with(|input| *input.borrow_mut() = Vec::new());
    OUTPUT.with(|output| *output.borrow_mut() = Vec::new());
}

#[cfg(feature = "benchmark")]
#[link(wasm_import_module = "benchmark")]
extern "C" {
    fn now() -> f64;
}

#[cfg(feature = "benchmark")]
#[no_mangle]
pub extern "C" fn profile_input() -> *const u8 {
    let result = INPUT.with(|input| {
        // The harness supplies a parameterless monotonic clock returning milliseconds.
        crate::timing::profile(&input.borrow(), || unsafe { now() })
    });
    OUTPUT.with(|output| {
        let mut output = output.borrow_mut();
        *output = match result {
            Ok((_, timings)) => serde_json::to_vec(&timings),
            Err(error) => serde_json::to_vec(&serde_json::json!({ "error": error })),
        }
        .expect("profiling values are serializable");
        output.as_ptr()
    })
}
