

/* 

OLD CODE for "retry X times until image successfully decodes"
Was a bad idea anyway, not needed anymore with cleaner code and better caching


const RETRY_INTERVAL = 500;
const MAX_TRIES = 10;
const rejectDelay = (reason) => 
{
return new Promise(function(resolve, reject) {
    setTimeout(reject.bind(null, reason), RETRY_INTERVAL); 
});
}

const decode = () => { return image.decode(); }
let p:Promise<any> = Promise.reject();
for(let i = 0; i < MAX_TRIES; i++) {
    p = p.catch(decode).catch(rejectDelay);
}
await p;

*/

export const convertCanvasToImage = async (canvas:HTMLCanvasElement) : Promise<HTMLImageElement> =>
{
    let image = new Image();
    image.src = canvas.toDataURL();
    await image.decode();
    image.dataset.index = canvas.dataset.index ?? "0";
    return image;
}

// Most of the time, we don't care in what order we receive the image elements
// If you do, set sorted to true
export const convertCanvasToImageMultiple = async (canvases:HTMLCanvasElement[], sorted = false) : Promise<HTMLImageElement[]> =>
{
    const promises = [];
    for(let i = 0; i < canvases.length; i++)
    {
        const canv = canvases[i];
        canv.dataset.index = i.toString();
        promises.push(convertCanvasToImage(canv));
    }
    const valuesUnsorted = await Promise.all(promises);
    if(!sorted) { return valuesUnsorted; }

    const valuesSorted = [];
    for(const val of valuesUnsorted)
    {
        const idx = parseInt(val.dataset.index);
        valuesSorted[idx] = val;
    }

    return valuesSorted;
}