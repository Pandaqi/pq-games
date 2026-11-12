import { Resource } from "./resource"

export class ResourceFont extends Resource
{
    fontface : FontFace;
    name : string;

    constructor(f: FontFace, params:any = {})
    {
        super()

        this.name = (params.name ?? params.key) ?? params.fontFamily;
        this.fontface = f;
    }
    
    clone() : ResourceFont
    {
        return new ResourceFont(this.fontface, this);
    }
    
}