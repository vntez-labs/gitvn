import type {
  Config,
  RawActivitySnapshot,
  ScoreResult,
} from "../../src/lib/scoring/models";

interface ScoringExports {
  memory: WebAssembly.Memory;
  prepare_input: (length: number) => number;
  score_input: () => number;
  profile_input?: () => number;
  output_length: () => number;
  release_buffers: () => void;
}

export const requestBytes = (snapshot: RawActivitySnapshot, config?: Config) =>
  new TextEncoder().encode(JSON.stringify({ snapshot, config }));

export async function createWasmScorer(
  module: WebAssembly.Module,
  imports?: WebAssembly.Imports,
) {
  const instance = await WebAssembly.instantiate(module, imports);
  const exports = instance.exports as unknown as ScoringExports;
  if (
    !(exports.memory instanceof WebAssembly.Memory) ||
    typeof exports.prepare_input !== "function" ||
    typeof exports.score_input !== "function" ||
    typeof exports.output_length !== "function" ||
    typeof exports.release_buffers !== "function"
  )
    throw new Error("Incompatible GitVN scoring WASM module");
  const decoder = new TextDecoder();

  function transfer(bytes: Uint8Array, profile = false) {
    const started = performance.now();
    const address = exports.prepare_input(bytes.length) >>> 0;
    if (!address) throw new Error("Invalid GitVN scoring WASM input length");
    new Uint8Array(exports.memory.buffer, address, bytes.length).set(bytes);
    const loaded = performance.now();
    const invoke = profile ? exports.profile_input : exports.score_input;
    if (!invoke) throw new Error("WASM profiling requires a benchmark build");
    const output = invoke() >>> 0;
    const ran = performance.now();
    const result = JSON.parse(
      decoder.decode(
        new Uint8Array(exports.memory.buffer, output, exports.output_length()),
      ),
    );
    if (typeof result.error === "string")
      throw new Error(`GitVN WASM scoring failed: ${result.error}`);
    return { result, boundary: loaded - started + performance.now() - ran };
  }

  return {
    score(snapshot: RawActivitySnapshot, config?: Config): ScoreResult {
      return transfer(requestBytes(snapshot, config)).result;
    },
    transfer,
    memoryBytes: () => exports.memory.buffer.byteLength,
    release: exports.release_buffers,
  };
}
