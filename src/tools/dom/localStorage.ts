export class LocalStorage
{
    key:string;
    data:Record<string,any>;

    constructor(key = "pandaqiGames")
    {
        this.key = key;
        this.read();
    }

    get(key:string)
    {
        return this.data[key];
    }

    write(key:string, value:any)
    {
        this.data[key] = value;
        this.save();
    }

    read()
    {
        this.data = JSON.parse(window.localStorage.getItem(this.key) ?? "{}");
    }

    save()
    {
        window.localStorage.setItem(this.key, JSON.stringify(this.data));
    }
}