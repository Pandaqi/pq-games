
export interface TranslateParams
{
    dict:Record<string,any>,
    key:string, 
    params:Record<string,any>, 
    language:string, 
    delimitersReplace: { pre?: string, post?: string }
    delimitersTranslate: { pre?: string, post?: string }
}

export const translate = (params:TranslateParams) =>
{
    const dict = params.language ? params.dict[params.language] : params.dict;
    const key = params.key ?? "";
    if(!key) { console.error(`Can't translate without a given key`, dict, params); return key; }
    if(!(key in dict)) { console.error(`No translation found for ${key} in dict.`, dict, params); return key; }

    let stringOutput : string = dict[key];
    const dlsr = params.delimitersReplace ?? {}
    const prefixReplace = dlsr.pre ?? "%";
    const suffixReplace = dlsr.post ?? "%";

    const dlst = params.delimitersTranslate ?? {};
    const prefixTranslate = dlst.pre ?? "`";
    const suffixTranslate = dlst.post ?? "`";

    // recursively translate stuff inside
    const regex = new RegExp(`${prefixTranslate}(.+)${suffixTranslate}`);
    stringOutput = stringOutput.replaceAll(regex, (fullMatch, captureGroup1) => {
        const newParams = Object.assign({}, params);
        newParams.key = captureGroup1;
        return translate(newParams);
    });
    
    // just flat replace any dynamic replacements
    for(const [key,data] of Object.entries(params))
    {
        stringOutput = stringOutput.replaceAll(`${prefixReplace}${key}${suffixReplace}`, data);
    }

    return stringOutput;
}