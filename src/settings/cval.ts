import { Vector2 } from "../geometry/vector2";

export class CVal
{
    val: any;
    input: string[];

    constructor(val:any, input:string|string[])
    {
        this.val = val;
        this.input = Array.isArray(input) ? input : [input];
    }

    getInput() { return this.input; }

    calculate(inputs:any[])
    {
        if(inputs == null) { return this; }
        if(this.input.length <= 0) { return this.val; }

        // this is mostly to support arrays to be calculated all at once (like vector-scalar multiplication)
        // in almost all cases, the value will just be a single number
        const values = Array.isArray(this.val) ? this.val : [this.val];
        const results = [];

        const inputsHavePoint = inputs.filter((x) => { return x instanceof Vector2 }).length > 0;
        const inputsHaveNumber = inputs.filter((x) => { return typeof x === "number" }).length > 0;

        // any type of class or object must currently be handled separately (as we don't know what multiplication MEANS for it)
        for(const value of values)
        {
            const isPoint = value instanceof Vector2 || inputsHavePoint;    
            const isNumber = (typeof value === "number" || inputsHaveNumber) && !isPoint;
            if(isNumber || isPoint)
            {
                let tempVal = new Vector2(value);
                for(const input of inputs)
                {
                    tempVal.scale(input);
                }

                const finalVal = isNumber ? tempVal.x : tempVal;
                results.push(finalVal);
            }
        }

        if(results.length == 1) { return results[0]; }
        return results;
    }
}