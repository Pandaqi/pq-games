import { HSLAToRGBA, RGBAToHSLA, RGBAToHEXA, HEXAToRGBA, HEXNumberToHEXA, HEXAToHEXNumber } from "./converters"

export type ColorRaw = number | Color | string
export class Color 
{
    h:number // 0-360
    s:number // 0-199
    l:number // 0-100
    a:number // 0-1

    static BLACK = new Color("#000000")
    static WHITE = new Color("#FFFFFF")
    static TRANSPARENT = new Color("transparent");

    // these are just the standard/most common CSS names; might want to add my own color palette in future
    // (either those "12 most contrasting colors" or my "12 color nature look palette" used for website)
    static SILVER = new Color("#C0C0C0");
    static GRAY = new Color("#808080");
    static MAROON = new Color("#800000");
    static RED = new Color("#FF0000");
    static PURPLE = new Color("#800080");
    static FUCHSIA = new Color("#FF00FF");
    static GREEN = new Color("#008000");
    static LIME = new Color("#00FF00");
    static OLIVE = new Color("#808000");
    static YELLOW = new Color("#FFFF00");
    static NAVY = new Color("#000080");
    static BLUE = new Color("#0000FF");
    static TEAL = new Color("#008080");
    static AQUA = new Color("#00FFFF");

    constructor(h:ColorRaw = null, s:number = 0, l:number = 0, a:number = 1.0) 
    {
        if(h == null || h == undefined) { a = 0; h = 0; }
        if(h == "transparent") { this.fromHSLA(0,0,0,0); return; }
        if(h instanceof Color) { this.fromColor(h); return; }
        if(typeof h === 'string') { this.fromHEXA(h); return; }
        this.fromHSLA(h, s, l, a);
    }

    clone()
    {
        return new Color(this);
    }

    /* The `from` functions */
    fromColor(c:Color)
    {
        this.fromHSLA(c.h, c.s, c.l, c.a);
        return this;
    }

    fromHEXNumber(n:number)
    {
        this.fromHEXA(HEXNumberToHEXA(n));
        return this;
    }

    fromHEXA(s:string)
    {
        const rgba = HEXAToRGBA(s,null);
        this.fromRGBA(...rgba);
        return this;
    }

    fromRGBA(r = 0, g = 0, b = 0, a = 255)
    {
        const hsl = RGBAToHSLA(r, g, b, a);
        this.fromHSLA(...hsl);
        return this;
    }

    fromHSLA(h = 0, s = 0, l = 0, a = 1)
    {
        this.h = h;
        this.s = s;
        this.l = l;
        this.a = a;
        return this;
    }

    /* The `to` functions */
    toCSS() { return this.toString(); }

    toString() : string
    {
        return this.toHSLA();
    }

    toHSLA()
    {
        return "hsla(" + this.h + ", " + this.s + "%, " + this.l + "%, " + this.a + ")"; 
    }

    toHSL()
    {
        return "hsl(" + this.h + ", " + this.s + "%, " + this.l + "%)";
    }

    toRGBA()
    {
        const [r,g,b,a] = this.toRGBARaw();
        return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";        
    }

    toRGBARaw()
    {
        return HSLAToRGBA(this.h, this.s, this.l, this.a);
    }

    toRGBRaw()
    {
        return HSLAToRGBA(this.h, this.s, this.l, this.a);
    }

    toRGB()
    {
        const [r,g,b,a] = this.toRGBRaw();
        return "rgb(" + r + ", " + g + "," + b + ")";
    }

    toHEXA()
    {
        return RGBAToHEXA(...HSLAToRGBA(this.h, this.s, this.l, this.a));
    }

    toHEX()
    {
        return this.toHEXA().slice(0, -2);
    }

    toHEXNumber()
    {
        return HEXAToHEXNumber(this.toHEXA());
    }

    // easy setters (which I apparently need a lot, as it turns out)
    getAlpha() { return this.a; }
    setAlpha(a:number)
    {
        this.a = a;
        return this;
    }

    getHue() { return this.h; }
    setHue(h:number)
    {
        this.h = h;
        return this;
    }

    getSaturation() { return this.s; }
    setSaturation(s:number)
    {
        this.s = s;
        return this;
    }

    getLightness() { return this.l; }
    setLightness(l:number)
    {
        this.l = l;
        return this;
    }
}