if(!navigator.gpu) throw new Error("WebGPU is not supported");
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();