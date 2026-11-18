struct VertexOutput
{
    @builtin(position) position : vec4f,
    @location(0) uv : vec2f
}
@fragment
fn fragment_main(input: VertexOutput) -> @location(0) vec4f
{
    var dis = length(input.uv);
    var col : vec4f = vec4f();
    if(dis<0.5)
    {
        col = vec4f(1.0,0.0,0.0,1.0);
    }
    return col;
}