export const STYLES = `
.settings
{
    max-width: 32em;
    margin: auto;
    padding: 1em;
    font-family: var(--font-body);
    background-color: var(--bg-color);
    border-radius: var(--border-radius);
    font-size: var(--font-size);

    --border-radius: 0.5em;
    --text-color: #222222;
    --bg-color: #DDDDDD;
    --mid-color: #999999;

    --font-heading: Trebuchet MS, Helvetica, Arial;
    --font-body: Trebuchet MS, Helvetica, Arial;
    --font-size: 16px;
}

h1
{
    margin: 0.5em;
    text-align: center;
    font-size: 24px;
}

.settings-container, .settings-group-content
{
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    width: 100%;
}

.settings-tools
{
    font-size: 9px;
    display: flex;
    margin: 0.5em;
    gap: 0.5em;
}

.settings-group
{
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    width: 100%;
}

.settings-group-header, button
{
    text-align: center;
    text-transform: uppercase;
    background-color: var(--text-color);
    color: var(--bg-color);
    width: 100%;
    padding: 0.5em;
    border-radius: var(--border-radius);
    font-weight: bold;
    font-family: var(--font-heading);
    font-size: 1.0em;
    border: none;
    cursor: pointer;
}

button:disabled
{
    opacity: 0.5;
    cursor: not-allowed;
}

.settings-group-header:hover, button:hover
{
    background-color: #FFFFFF;
    color: var(--text-color);
}

.settings-group-content
{
    padding-left: 1em;
}

.settings-element
{
    display: flex;
    gap: 1em;
    width: 100%;
}

.settings-element label
{
    width: 100%;
}

.settings-element input, .settings-element select
{
    width: 100%;
}

.settings-remark
{
    font-style: italic;
    color: var(--mid-color);
}

.feedback-node-sub
{
    font-style: italic;
    font-size: 0.62em;
    text-align: center;
    width: 100%;
}
`;