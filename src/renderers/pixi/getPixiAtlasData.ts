import type { ResourceImage } from "../../layout/resources/resourceImage"

export const getPixiAtlasData = (res:ResourceImage) =>
{
    const data = 
    {
        frames: {},
        meta: {
            image: res.getSRCString(),
            format: 'RGBA8888',
            size: { w: res.getSize().x, h: res.getSize().y },
            scale: 1
        },
    };

    for(let i = 0; i < res.countFrames(); i++)
    {
        const key = "frame_" + i;
        const frameData = res.getFrameData(i);
        data.frames[key] = 
        {
            frame: { x: frameData.x, y: frameData.y, w: frameData.width, h: frameData.height },
            sourceSize: { w: frameData.width, h: frameData.height },
            spriteSourceSize: { x: 0, y: 0, w: frameData.width, h: frameData.height }
        }
    }

    return data;
}