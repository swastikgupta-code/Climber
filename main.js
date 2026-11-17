async function init()
{
    const canvas = document.getElementById("gpu_canvas");
    const context = canvas.get_context("webgpu");
    if(!navigator.gpu) throw new Error("WebGPU is not supported");
    const adapter = await navigator.gpu.requestAdapter();
    if(!adapter) throw new Error("Adapter not found");
    const device = await adapter.requestDevice();
}
init();