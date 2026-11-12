import { Vector2 } from "../vector2";

export enum AlignValue
{
    START,
    MIDDLE,
    END,
    SPACE_BETWEEN,
    SPACE_AROUND,
    SPACE_EVENLY,
    STRETCH
}

export const getRectangleCornersWithOffset = (size:Vector2, offset:Vector2) =>
{
    return [
        offset.clone(),
        new Vector2(size.x - offset.x, offset.y),
        size.clone().sub(offset.clone()),
        new Vector2(offset.x, size.y - offset.y)
    ]
}


export interface CenterAroundParams
{
    pos?: Vector2,
    num?: number,
    size: Vector2[]|Vector2|number,
    dir?: Vector2,
    align?: AlignValue
}

export const getPositionsCenteredAround = (params:CenterAroundParams) =>
{
    const num = params.num ?? 1;
    if(num <= 0) { return []; }

    const basePos = params.pos ?? new Vector2();
    if(num == 1) { return [basePos.clone()]; }

    const dir = params.dir ?? Vector2.RIGHT;
    const align = params.align ?? AlignValue.MIDDLE;

    let dims = params.size;
    if(typeof dims === "number") { dims = new Vector2(dims); }
    const dimsDynamic : Vector2[] = Array.isArray(dims) ? dims : [];
    const nonUniformDims = dimsDynamic.length > 0;

    if(nonUniformDims)
    {
        let totalOffset = new Vector2();
        for(let i = 0; i < num; i++)
        {
            totalOffset.add(dims[i]);
        }
        totalOffset.negate();

        if(align == AlignValue.START) { totalOffset.scale(0.0); }
        else if(align == AlignValue.MIDDLE) { totalOffset.scale(0.5); }
        else if(align == AlignValue.END) { totalOffset.scale(1.0); }

        totalOffset.add(dimsDynamic[0].clone().scale(0.5));

        const positions = [];
        let lastPos = basePos.clone().move(dir.clone().scale(totalOffset));
        for(let i = 0; i < num; i++)
        {
            positions.push(lastPos.clone());

            const isLastElement = i >= (num-1);
            if(isLastElement) { continue; }
            lastPos.add(dir.clone().scale(dimsDynamic[i]).scale(0.5));
            lastPos.add(dir.clone().scale(dimsDynamic[i+1]).scale(0.5));
        }

        return positions;
    }

    if((dims as Vector2).isZero()) { return []; }

    const totalOffset = dir.clone().scaleFactor(num - 1).scale(dims).negate();
    
    if(align == AlignValue.START) { totalOffset.scale(0.0); }
    else if(align == AlignValue.MIDDLE) { totalOffset.scale(0.5); }
    else if(align == AlignValue.END) { totalOffset.scale(1.0); }

    const positions = [];
    for(let i = 0; i < num; i++)
    {
        const myOffset = dir.clone().scaleFactor(i).scale(dims);
        const pos = basePos.clone().move(totalOffset).move(myOffset);
        positions.push(pos);
    }
    return positions;
}