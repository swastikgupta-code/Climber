@vertex
fn vertex_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f
{
    return vec4f(0.0,0.0,0.0,1.0);
}