async function init()
{
    const canvas = document.getElementById("gpu_canvas");
    if(!navigator.gpu) throw new Error("WebGPU is not supported");
    const adapter = await navigator.gpu.requestAdapter();
    if(!adapter) throw new Error("Adapter not found");
    const device = await adapter.requestDevice();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const context = canvas.getContext("webgpu");
    context.configure({
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "opaque"
    });
    const commandEncoder = device.createCommandEncoder();
    const TextureView = context.getCurrentTexture().createView();
    const renderpass = {
        colorAttachments: [
            {
                view: TextureView,
                clearValue: {r: 1.0,g: 0.0,b: 1.0,a : 1.0},
                loadOp: "clear",
                storeOp: "store"
            }
        ]
    };
    const passEncoder = commandEncoder.beginRenderPass(renderpass);
    
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
}
init();