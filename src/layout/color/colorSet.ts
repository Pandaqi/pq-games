import { Color, ColorRaw } from "./color";

export class ColorSet
{
    base: Color;
    inkFriendly: Color;

    constructor(base:ColorRaw, inkFriendly:ColorRaw)
    {
        this.base = new Color(base);
        this.inkFriendly = new Color(inkFriendly ?? this.base);
    }

    setInkBlack() { this.inkFriendly = Color.BLACK.clone(); }
    setInkWhite() { this.inkFriendly = Color.WHITE.clone(); }
    setInkTransparent() { this.inkFriendly = Color.TRANSPARENT.clone(); }

    select(inkFriendly = false)
    {
        if(inkFriendly) { return this.inkFriendly; }
        return this.base;
    }
}