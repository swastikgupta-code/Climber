struct VertexOutput
{
    @builtin(position) position : vec4f,
    @location(0) uv : vec2f
}
struct Uniforms
{
    aspect: f32,
    time: f32,
    speed: vec2f,
    pos: vec2f,
    padding : vec2f,
    collider: array<vec4f,3>
}
@group(0) @binding(0) var<uniform> constants: Uniforms;
@fragment
fn fragment_main(input: VertexOutput) -> @location(0) vec4f
{
    var uv: vec2f = vec2f(input.uv.x*constants.aspect,input.uv.y);
    var cen : vec2f = constants.pos;
    var dis = length(uv-cen);
    var col : vec4f = vec4f();
    if(dis<0.2)
    {
        col = vec4f(1.0,0.0,0.0,1.0);
    }
    for(var i = 0;i<3;i++)
    {
        let rect = constants.collider[i];
        if(uv.x>rect.x && uv.x<(rect.x+rect.z) && uv.y>rect.y && uv.y<(rect.y+rect.w))
        {
            col = vec4f(0.0,1.0,0.0,1.0);
        }
    }
    return col;
}