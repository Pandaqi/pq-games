const isValidHex = (hex:string) => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex)

const getChunksFromString = (st:string, chunkSize:number) => st.match(new RegExp(`.{${chunkSize}}`, "g"))

const convertHexUnitTo256 = (hexStr:string) => parseInt(hexStr.repeat(2 / hexStr.length), 16)

const getAlphaFloat = (a:number, alpha:number) => {
    if (typeof a !== "undefined") { return a / 255 }
    if ((typeof alpha != "number") || alpha <0 || alpha >1) { return 1 }
    return alpha
}

export const HEXAToRGBA = (hex:string, alpha:number) => {
    //if(hex.length == 7) { hex += "FF"; }
    //if(hex.length == 3) { hex += "F"; }

    if (!isValidHex(hex)) {throw new Error("Invalid HEX")}
    const chunkSize = Math.floor((hex.length - 1) / 3)
    const hexArr = getChunksFromString(hex.slice(1), chunkSize)
    const [r, g, b, alp] = hexArr.map(convertHexUnitTo256)
    const a = getAlphaFloat(alp, alpha);
    return [r, g, b, a];
}

export const HSLAToHex = (h = 0, s = 0, l = 0, alpha = 1) =>
{
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n:number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        // convert to Hex and prefix "0" if needed
        return Math.round(255 * color).toString(16).padStart(2, '0');   
    };
    const alphaHex = Math.round(255*alpha).toString(16).padStart(2, '0');
    return `#${f(0)}${f(8)}${f(4)}${alphaHex}`;
}

export const HSLAToRGBA = (h = 0, s = 0, l = 0, alpha = 1) =>
{
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    
    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));
    return [r,g,b,alpha];
}

export const RGBAToHEXA = (r = 0, g = 0, b = 0, a = 1.0) =>
{
    a = Math.round(a * 255);
    let arr = [r.toString(16), g.toString(16), b.toString(16), a.toString(16)];
    arr = arr.map(string => string.length === 1 ? "0" + string : string);
    return "#" + arr.join("");
}

export const RGBAToHSLA = (r = 0, g = 0, b = 0, a = 1.0) =>
{
    r /= 255;
    g /= 255;
    b /= 255;

    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s
        ? l === r
        ? (g - b) / s
        : l === g
        ? 2 + (b - r) / s
        : 4 + (r - g) / s
        : 0;
    
    const h2 = 60 * h < 0 ? 60 * h + 360 : 60 * h;
    const s2 = 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0);
    const l2 = (100 * (2 * l - s)) / 2;
    return [h2,s2,l2,a];
}

// the HEXNumber does NOT have the alpha component; this is typical for all programs that require this format, e.g. Phaser
export const HEXNumberToHEXA = (num:number) =>
{
    return `#${num.toString(16)}FF`;
}

export const HEXAToHEXNumber = (hex:string) =>
{
    return `0x${parseInt(hex.slice(1,-2), 16)}`;
}