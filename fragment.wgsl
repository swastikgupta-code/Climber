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
    r_uv: vec2f,
    w: f32,
    h: f32
}
@group(0) @binding(0) var<uniform> constants: Uniforms;
@fragment
fn fragment_main(input: VertexOutput) -> @location(0) vec4f
{
    var uv: vec2f = vec2f(input.uv.x*constants.aspect,input.uv.y);
    var cen : vec2f = constants.pos;
    var dis = length(uv-cen);
    var col : vec4f = vec4f();
    if(dis<0.5)
    {
        col = vec4f(1.0,0.0,0.0,1.0);
    }
    if(uv.x>constants.r_uv.x && uv.x<(constants.r_uv.x+constants.w) &&
    uv.y>constants.r_uv.y && uv.y<(constants.r_uv.y+constants.h))
    {
        col = vec4f(0.0,1.0,0.0,1.0);
    }
    return col;
}