let device,context,pipeline,uniformBuffer,bindGroup;
var data = new Float32Array(4);
var speed = [0.2,0.0];
var keysPressed = new Set();
async function init()
{
    const canvas = document.getElementById("gpu_canvas");
    if(!navigator.gpu) throw new Error("WebGPU is not supported");
    const adapter = await navigator.gpu.requestAdapter();
    if(!adapter) throw new Error("Adapter not found");
    device = await adapter.requestDevice();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context = canvas.getContext("webgpu");
    context.configure({
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "opaque"
    });
    const [vertex_code,fragment_code] = await Promise.all([
        fetch("./vertex.wgsl").then((res)=>res.text()),
        fetch("./fragment.wgsl").then((res)=>res.text())
    ]);
    const vertexModule = device.createShaderModule({code: vertex_code});
    const fragmentModule = device.createShaderModule({code: fragment_code});
    pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: vertexModule,
            entryPoint: "vertex_main"
        },
        fragment: {
            module: fragmentModule,
            entryPoint: "fragment_main",
            targets: [{format: navigator.gpu.getPreferredCanvasFormat()}]
        },
        primitive: {
            topology: "triangle-list"
        }
    });
    uniformBuffer = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {buffer: uniformBuffer}
            }
        ]
    });
    requestAnimationFrame(render);
}
function render(time)
{
    const canvas = context.canvas;
    const aspect = canvas.width/canvas.height;
    physics(time);
    data[0] = aspect;
    data[1] = time * 0.001;
    data[2] = speed[0];
    data[3] = speed[1];
    device.queue.writeBuffer(uniformBuffer,0,data);
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
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0,bindGroup);
    passEncoder.draw(6);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
}
function physics(time)
{
    if(keysPressed.has("KeyW"))
        speed[1] += 1;
    else if(keysPressed.has("KeyS"))
        speed[1] -= 1;
    if(keysPressed.has("KeyA"))
        speed[0] -= 1;
    else if(keysPressed.has("KeyD"))
        speed[0] += 1;
    keysPressed = new Set();
    let mag = Math.sqrt(speed[0]**2 + speed[1]**2)
    if(mag<0.001)
        return;
    speed[0] = speed[0] /mag * 0.2;
    speed[1] = speed[1] /mag * 0.2;
}
window.addEventListener('keydown',(event) => {
    keysPressed.add(event.code);
});
init();