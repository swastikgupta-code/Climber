let device,context,pipeline,uniformBuffer,bindGroup,player,lastTime=0;
var data = new Float32Array(8);
var keysPressed = new Set();
class Vector
{
    constructor(x=0,y=0,z=0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    len()
    {
        return Math.sqrt(this.x**2+this.y**2+this.z**2);
    }
    dot(v)
    {
        return (this.x*v.x+this.y*v.y+this.z*v.z);
    }
    add(v)
    {
        return new Vector(this.x+v.x,this.y+v.y,this.z+v.z);
    }
    sub(v)
    {
        return new Vector(this.x-v.x,this.y-v.y,this.z-v.z);
    }
    mul(s)
    {
        return new Vector(this.x*s,this.y*s,this.z*s);
    }
    div(s)
    {
        return new Vector(this.x/s,this.y/s,this.z/s);
    }
    cross(v)
    {
        return new Vector(this.y*v.z-this.z*v.y,this.z*v.x-this.x*v.z,this.x*v.y-this.y*v.x);
    }
    normalize()
    {
        if(this.len()<0.0001)
        {
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
        else
        {
            let len = this.len();
            this.x = this.x/len;
            this.y = this.y/len;
            this.z = this.z/len;
        }
    }
}
class Player
{
    constructor(pos=new Vector(0,0,0),speed=0.2,dir=new Vector(1,0,0))
    {
        this.pos = pos;
        this.speed = speed;
        this.dir = dir
    }
    move(time)
    {
        this.pos = this.pos.add(this.dir.mul(this.speed*time));
    }
}
async function init()
{
    const canvas = document.getElementById("gpu_canvas");
    if(!navigator.gpu) throw new Error("WebGPU is not supported");
    const adapter = await navigator.gpu.requestAdapter();
    if(!adapter) throw new Error("Adapter not found");
    device = await adapter.requestDevice();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player = new Player();
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
        size: data.byteLength,
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
    time /= 1000;
    let delta_time = time-lastTime;
    const canvas = context.canvas;
    const aspect = canvas.width/canvas.height;
    physics(delta_time);
    player.move(delta_time);
    data[0] = aspect;
    data[1] = delta_time;
    data[2] = player.dir.mul(player.speed).x;
    data[3] = player.dir.mul(player.speed).y;
    data[4] = player.pos.x;
    data[5] = player.pos.y;
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
    lastTime = time;
    requestAnimationFrame(render);
}
function physics(time)
{
    let right = new Vector(1,0);
    let up = new Vector(0,1);
    if(keysPressed.has("KeyW"))
        player.dir = player.dir.add(up);
    else if(keysPressed.has("KeyS"))
        player.dir = player.dir.sub(up);
    if(keysPressed.has("KeyA"))
        player.dir = player.dir.sub(right);
    else if(keysPressed.has("KeyD"))
        player.dir = player.dir.add(right);;
    keysPressed = new Set();
    player.dir.normalize();
}
window.addEventListener('keydown',(event) => {
    keysPressed.add(event.code);
});
init();