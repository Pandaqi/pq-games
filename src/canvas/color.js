export default class Color {
    constructor(h, s, l) {
        this.h = h;
        this.s = s;
        this.l = l;
    }

    toString()
    {
        return "hsl(" + this.h + ", " + this.s + "%, " + this.l + "%)"; 
    }

    toHex()
    {
        let l = this.l, s = this.s, h = this.h;

        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
        };
        
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    lighten(dl = 0)
    {
        const newLightness = Math.max(Math.min(this.l + dl, 100), 0);
        return new Color(this.h, this.s, newLightness);
    }

    saturate(ds = 0)
    {
        const newSaturation = Math.max(Math.min(this.s + ds, 100), 0);
        return new Color(this.h, newSaturation, this.l);
    }

    clone()
    {
        return new Color(this.h, this.s, this.l);
    }
}