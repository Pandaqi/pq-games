export class ProgressBar
{
    node : HTMLElement
    phases : string[]
    curPhase : number
    headerNode : HTMLElement
    infoNode : HTMLElement

    constructor(container:HTMLElement = document.body)
    {
        this.node = this.setupHTML(container)
        this.phases = [];
        this.curPhase = -1;
    }

    setPhases(p:string[])
    {
        this.phases = p;
    }

    setupHTML(container:HTMLElement)
    {
        const div = document.createElement("div");
        container.appendChild(div);
        
        div.classList.add("progress-bar-container");
        div.style.position = "fixed";
        div.style.left = "0";
        div.style.right = "0";
        div.style.top = "0";
        div.style.bottom = "0";
        div.style.display = "flex";
        div.style.justifyContent = "center";
        div.style.alignItems = "center";
        div.style.alignContent = "center";

        const subdiv = document.createElement("div");
        div.appendChild(subdiv);
        subdiv.classList.add("progress-bar");
        subdiv.style.maxWidth = "500px";

        const header = document.createElement("h1");
        subdiv.appendChild(header);
        header.classList.add("progress-bar-header");
        this.headerNode = header;
        header.style.textAlign = "center";
        header.style.fontFamily = "var(--header-font)";
        header.style.marginBottom = "0";

        const extraInfo = document.createElement("p");
        subdiv.appendChild(extraInfo);
        extraInfo.classList.add("progress-bar-info");
        this.infoNode = extraInfo;
        extraInfo.style.textAlign = "center";
        extraInfo.style.opacity = "0.66";
        extraInfo.style.margin = "0";
        extraInfo.style.fontFamily = "var(--body-font)";

        return div;
    }

    changeVerticalAlign(v:string)
    {
        this.node.style.alignItems = v;
    }

    gotoNextPhase() 
    { 
        this.curPhase = Math.min((this.curPhase + 1), this.phases.length - 1);
        this.update();
    }

    gotoPhase(p)
    {
        this.curPhase = this.phases.indexOf(p);
        this.update();
    }

    getCurPhaseName() { return this.phases[this.curPhase]; }

    update()
    {
        this.headerNode.innerHTML = this.getCurPhaseName();
        this.infoNode.innerHTML = "";
    }

    setInfo(i:string)
    {
        this.infoNode.innerHTML = i;
    }


}