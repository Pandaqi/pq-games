export const lerp = (a:number, b:number, factor:number) =>
{
    return a + (b - a) * factor;
}

// Spherical lerp = for number ranges that wrap/modulo (mostly rotation)
export const slerp = (a:number, b:number, factor = 0.5, wrap = 1.0) =>
{
    // bring into range 0<->wrap
    // (javascript can do negative modulo, but the remainder will also be negative, so +wrap needed)
    a = a % wrap;
    b = b % wrap;
    if(a < 0) { a += wrap; }
    if(b < 0) { b += wrap; }

    // calculate which path is shortest
    const distLeft = ((a + wrap) - b) % wrap;
    const distRight = ((b + wrap) - a) % wrap;

    // lerp through that path
    const lerpLeft = distLeft < distRight;
    if(lerpLeft) { 
        if(b <= a) { return lerp(a, b, factor); } // equals here is important, otherwise slerping between identical numbers takes the case below and that's NOT CORRECT
        else { return lerp(a + wrap, b, factor) % wrap; }
    } else {
        if(a <= b) { return lerp(a, b, factor); }
        else { return lerp(a, b + wrap, factor) % wrap; }
    }
}