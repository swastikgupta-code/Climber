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
    end_point : vec2f,
    collider: array<vec4f,5>,
    has_end_point: f32
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
    else if(dis<0.21)
    {
         col = vec4f(1.0,1.0,0.0,1.0);
    }
    for(var i = 0;i<5;i++)
    {
        let rect = constants.collider[i];
        if(uv.x>rect.x && uv.x<(rect.x+rect.z) && uv.y>rect.y && uv.y<(rect.y+rect.w))
        {
            col = vec4f(0.0,1.0,0.0,1.0);
        }
    }
    if(constants.has_end_point>0.5)
    {
        var line: vec2f = constants.end_point - cen;
        var diff = uv - cen;
        var t = dot(line,diff)/(length(line)*length(line));
        if(t>0 && t<1)
        {
            var point = cen*(1-t)+constants.end_point*t;
            var dis = length(uv-point);
            if(dis<0.02)
            {
                col = vec4f(0.0,0.0,1.0,1.0);
            }
        }
    }
    return col;
}