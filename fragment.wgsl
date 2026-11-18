struct VertexOutput
{
    @builtin(position) position : vec4f,
    @location(0) uv : vec2f
}
struct Uniforms
{
    aspect: f32,
    time: f32
}
@group(0) @binding(0) var<uniform> constants: Uniforms;
@fragment
fn fragment_main(input: VertexOutput) -> @location(0) vec4f
{
    var speed : vec2f = vec2f(0.2,0.0);
    var cen : vec2f = vec2f(0.0,0.0)+speed;
    var dis = length(vec2f(input.uv.x*constants.aspect,input.uv.y)-cen);
    var col : vec4f = vec4f();
    if(dis<0.5)
    {
        col = vec4f(1.0,0.0,0.0,1.0);
    }
    return col;
}