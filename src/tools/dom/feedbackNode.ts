export const sendProgressPhaseSignal = (node:HTMLElement, value:string) =>
{
    const ev = new CustomEvent("feedback-progress-main", { detail: value });
    node.dispatchEvent(ev);
}

export const sendProgressInfoSignal = (node:HTMLElement, value:string) =>
{
    const ev = new CustomEvent("feedback-progress-sub", { detail: value });
    node.dispatchEvent(ev);
}

export class FeedbackNode
{
    signalReceiver:HTMLElement;
    nodeMain: HTMLElement;
    nodeSub: HTMLElement;

    constructor(nodeMain:HTMLElement, nodeSub:HTMLElement)
    {
        this.nodeMain = nodeMain;
        this.nodeSub = nodeSub;

        this.signalReceiver = document.createElement("div");
        this.signalReceiver.addEventListener("feedback-progress-main", (ev:CustomEvent) => {
            this.nodeMain.innerHTML = ev.detail;
        });

        this.signalReceiver.addEventListener("feedback-progress-sub", (ev:CustomEvent) => {
            this.nodeSub.innerHTML = ev.detail;
        });
    }
}