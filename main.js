let device,context,pipeline,uniformBuffer,bindGroup,player,lastTime=0;
let r = 0.2;
let gravity = 0.2;
let fixed_point = null;
let heights = [];
let colliders = [];
var data = new Float32Array(32);
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
class Entity
{
    constructor(pos=new Vector(0,0,0),speed=0.4,dir=new Vector(1,0,0))
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
class Player extends Entity
{
    constructor(pos=new Vector(0,0,0),speed=0.4,dir=new Vector(1,0,0))
    {
        super(pos,speed,dir);
    }
}
class rectangle_collider extends Entity
{
    constructor(x,y,width,height,speed=0.4,dir=new Vector(0,0,0))
    {
        super(new Vector(x,y),speed,dir);
        this.width = width;
        this.height = height;
    }
    is_colliding(point)
    {
        let x_max = this.pos.x + this.width;
        let x_min = this.pos.x;
        let y_max = this.pos.y + this.height;
        let y_min = this.pos.y;
        if(point.x < x_max+r && point.x > x_min-r && point.y < y_max+r && point.y > y_min-r)
        {
            return true;
        }
        return false;
    }
    array()
    {
        let arr = new Float32Array(4);
        arr[0] = this.pos.x;
        arr[1] = this.pos.y;
        arr[2] = this.width;
        arr[3] = this.height;
        return arr;
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
    player = new Player(new Vector(0,-0.9));
    create_environment();
    add_heights();
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
    player.move(delta_time);
    colliders.forEach((collider)=>{
        collider.move(delta_time);
    });
    data[0] = aspect;
    data[1] = delta_time;
    data[2] = player.dir.mul(player.speed).x;
    data[3] = player.dir.mul(player.speed).y;
    data[4] = player.pos.x;
    data[5] = player.pos.y;
    data[6] = 0.0;
    data[7] = 0.0;
    colliders.forEach((collider,index)=>{
        data.set(collider.array(),8+index*4);
    });
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
    physics(delta_time);
    requestAnimationFrame(render);
}
function physics(time)
{
    let right = new Vector(1,0);
    let up = new Vector(0,1);
    let gap = 0.001+r;
    if(keysPressed.has("KeyA"))
        player.dir = player.dir.sub(right);
    else if(keysPressed.has("KeyD"))
        player.dir = player.dir.add(right);
    if(keysPressed.has("Space"))
    {
        let closest_y = -100;
        for(const height of heights)
        {
            if(height>player.pos.y)
                closest_y = height;
                break;
        }
        if(closest_y==-100)
            keysPressed.delete("Space");
        else
        {
            fixed_point = new Vector(player.pos.x,closest_y);
        }
    }
    player.dir.normalize();
    colliders.forEach((collider)=>{
        if(collider.is_colliding(player.pos))
        {
            let overlap_left = player.pos.x+r - collider.pos.x;
            let overlap_right = (collider.pos.x+collider.width)+r - player.pos.x;
            let overlap_down = player.pos.y - collider.pos.y+r;
            let overlap_up = (collider.pos.y+collider.height) - player.pos.y+r;
            let min_overlap_x = Math.min(overlap_left,overlap_right);
            let min_overlap_y = Math.min(overlap_up,overlap_down);
            if(min_overlap_x < min_overlap_y)
            {
                if(overlap_left<overlap_right)
                {
                    player.pos.x = collider.pos.x - gap;
                }
                else
                {
                    player.pos.x = collider.pos.x + collider.width + gap;
                }
                player.dir.x *= -1;
            }
            else
            {
                if(overlap_down<overlap_up)
                {
                    player.pos.y = collider.pos.y - gap;
                }
                else
                {
                    player.pos.y = collider.pos.y + collider.height + gap;
                }
                player.dir.y *= -1;
            }
        }
    });
}
function create_environment()
{
    colliders.push(new rectangle_collider(-2.2,-1.1,4.4,0.2));
    colliders.push(new rectangle_collider(-1.8,-0.2,0.9,0.2));
    colliders.push(new rectangle_collider(0.6,-0.6,1.2,0.2));
    colliders.push(new rectangle_collider(-2.3,-1.2,0.2,3.2));
    colliders.push(new rectangle_collider(2.1,-1.2,0.2,3.2));
}
function add_heights()
{
    colliders.forEach((collider,index)=>{
        if(!heights.includes(collider.height))
        {
            heights.push(collider.height);
        }
    });
    heights.sort((a,b)=>a-b);
}
window.addEventListener('keydown',(event) => {
    keysPressed.add(event.code);
});
window.addEventListener('keyup',(event) => {
    keysPressed.delete(event.code);
});
init();