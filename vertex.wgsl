struct VertexOutput
{
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f
}
@vertex
fn vertex_main(@builtin(vertex_index) index: u32) -> VertexOutput
{
    var pos = array<vec2f,3> 
    (
        vec2f(-1.0,-1.0),
        vec2f(-1.0,1.0),
        vec2f(1.0,1.0)
    );
    var output: VertexOutput;
    output.uv = pos[index];
    output.position = vec4f(pos[index],0.0,1.0);
    return output;
}