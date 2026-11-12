
// @TODO: this is just ONE global signal manager
// I should really create an easy system to attach signals to ANY existing object/node
export class SignalManager
{
    // This node does nothing, but it allows us to tap into DOM for events
    node:HTMLDivElement;
    listeners: Record<string, Function[]>

    constructor()
    {
        this.node = document.createElement("div");
        this.listeners = {};
    }

    dispatchEvent(type, data = {})
    {
        const ev = new CustomEvent(type, { detail: data });
        this.node.dispatchEvent(ev);
    }

    subscribe(type:string, callback:(ev) => void)
    {
        if(!this.listeners[type]) { this.listeners[type] = []; }
        this.listeners[type].push(callback);
        this.node.addEventListener(type, callback);
    }

    unsubscribe(type:string, callback:(ev) => void)
    {
        const idx = this.listeners[type].indexOf(callback);
        if(idx < 0)
        {
            console.error("Can't unsubscribe nonexisting signal of type " + type);
            console.error(callback);
            return;
        }

        this.listeners[type].splice(idx, 1);
        this.node.removeEventListener(type, callback);
    }
}