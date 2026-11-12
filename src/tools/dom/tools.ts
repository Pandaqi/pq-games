import { Vector2 } from "../../geometry/vector2";

export const elem = (type:string, classes:string[] = [], inner = "") =>
{
    const elem = document.createElement(type);
    elem.classList.add(...classes);
    elem.innerHTML = inner;
    return elem;
}

export interface AddTouchEventParams
{
    node?:HTMLElement,
    all?:EventListenerOrEventListenerObject,
    start?:EventListenerOrEventListenerObject,
    move?:EventListenerOrEventListenerObject,
    end?:EventListenerOrEventListenerObject,
    cancel?:EventListenerOrEventListenerObject
}

const NOTHING_FUNCTION = (ev) => {}

export const addTouchEvents = (params:AddTouchEventParams) =>
{
    const n = params.node;
    const start = (params.start ?? params.all) ?? NOTHING_FUNCTION;
    const move = (params.move ?? params.all) ?? NOTHING_FUNCTION;
    const end = (params.end ?? params.all) ?? NOTHING_FUNCTION;
    const cancel = (params.cancel ?? params.all) ?? NOTHING_FUNCTION;

    n.addEventListener("touchstart", start);
    n.addEventListener("mousedown", start);

    n.addEventListener("touchmove", move);
    n.addEventListener("mousemove", move);

    n.addEventListener("touchend", end);
    n.addEventListener("mouseup", end);

    n.addEventListener("touchcancel", cancel);
    n.addEventListener("mouseleave", cancel);

    // @REMARK: mouseleave/mouseup also triggers if some other (inner) element gets underneath the mouse cursor
    // So make sure that doesn't happen, or set pointer-events:none on those, otherwise things get wonky
}

export const awaitAll = async (list:any[], method:string = "") =>
{
    const promises = [];
    for(const elem of list)
    {
        const callback = method ? elem[method] : elem;
        promises.push(callback());
    }
    const results = await Promise.all(promises);
    return results.flat();
}

export const preventDefaults = (ev:Event) =>
{
    if(!ev) { return false; }
    ev.stopPropagation(); 
    ev.preventDefault();
    return false;
}

export const convertEventToLocal = (ev:MouseEvent|TouchEvent, node:HTMLElement) =>
{
    const p = new Vector2();
    const offset = node.getBoundingClientRect();
    p.move(new Vector2({ x: -offset.left, y: -offset.top }));

    if(ev instanceof TouchEvent) 
    {
        let touch = ev.touches[0] || ev.changedTouches[0];
        p.move(new Vector2({ x: touch.clientX, y: touch.clientY }));
    }
    
    if(ev instanceof MouseEvent) 
    {
        p.move(new Vector2({ x: ev.clientX, y: ev.clientY }));
    } 

    return p;
}

/*
if(ev.type == 'touchstart' || ev.type == 'touchmove' || ev.type == 'touchend' || ev.type == 'touchcancel') {
        let touch = ev.touches[0] || ev.changedTouches[0];
        p.move(new Vector2({ x: touch.clientX, y: touch.clientY }));
    } else if (ev.type == 'mousedown' || ev.type == 'mouseup' || ev.type == 'mousemove' || ev.type == 'mouseover'|| ev.type == 'mouseout' || ev.type == 'mouseenter' || ev.type=='mouseleave' ) {
        p.move(new Vector2({ x: ev.clientX, y: ev.clientY }));
    } 
*/

export const createTableHTML =  <T>(data:T[][]) =>
{
    const table = elem("table");
    for(const element of data)
    {
        const tr = elem("tr");
        for(const val of element)
        {
            const td = elem("td", undefined, val.toString());
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    return table;
}