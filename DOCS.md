# Documentation

This page details the general philosophy/workings of this library as well as specifics on the syntax and how to use it. 

I give the philosophy because it helps all the technical details fall into place and helps you understand if this framework is even for you. Just throwing raw numbers and properties and workflows at people tends to be a bad way to learn.

## Philosophy

### Background

Once upon a time I thought "wait, wouldn't it be possible to generate the material for board games through code?" After placing and modifying 60+ cards by hand in _Adobe Illustrator_, this felt like a dream come true. And so I started writing a library that could do this. With every game I made, I added some more functionality (a shadow effect, a way to flip/mirror images, text wrapping, etcetera) and streamlined more of the process.

At the time, my requirements were ...

* **Very small.** This entire system has to be downloaded on every web page.
* **Very fast.** You don't want people to press the button and have their browser freeze for 5 minutes.
* **Very independent.** I have a terrible old laptop that simply doesn't support many modern technologies (e.g. WebGL is entirely iffy), that can't handle downloading loads of node modules, that breaks whenever there's any web of dependencies anywhere.
* **Very practical.** I simply grew the library as I went, adding a feature only once I needed it.

This went on for about 5 years as I launched board games on Pandaqi. I did all of that for free, in my spare time, just hoping to give some people a nice game. One they could edit/configure and generate _on the spot_, right inside their browser.

### v1 -> v2

At some point, however, I wanted to make bigger games and sell them on my new online store. And so I decided to look at the work I'd done, think back about all the things I hated and the things I liked about it, and do a massive rewrite for the future. That's the code I decided to open source and the code I use for generating (most) board games I sell.

And so I wrote down a new set of requirements (or "guiding principles").

* **Very correct.** If I sell a board game PDF for 10 bucks, it has to work flawlessly and look exactly as intended. I can't see a minor bug (like text not centering perfectly) and shrug anymore.
* **Very customizable.** When you buy a game, you get the generator as well. And I want anyone to be able to easily change whatever they need, through a clean interface of toggles and sliders. (All this configuration and control, of course, also helps the developer immensely.)
* **Very flexible.** I've learned that you simply can't predict the future. I tried and failed every time, working for weeks on a feature I never needed or writing "clean" code that had to be thrown out when I realized a new requirement a month later. I can only code something in a way that's clean, flexible, and easy to understand, so I can make any necessary changes in the future.
* **Very independent.** At time of writing, yes, I am still a poor person with terrible hardware. But I also wanted this library to function without internet/server, such that you can simply open a local file in your browser and it will work.
* **Very specific.** I considered abandoning this project and just using another JS layout/drawing framework _so many times_. But those other frameworks often lacked lots of _specific_ features I needed (such as richer text formatting). This really taught me the value of owning your entire system and being able to add unique practical features at will. Features that are highly specific to this library's use case: generate complicated 2D-layouts into PDFs, most likely to be used for printing board games.

As you see, being small or very fast to download stopped being a priority. Because the first use case of this system is for game developers to use locally, not to host some final generator on a website that anyone can use. Still, I am very minimalist and the framework is probably still ludicrously small and fast because of that.

### Practical Code Guidelines

What does this mean in practice? How are these requirements actually put into effect?

* The codebase is a **mixture of classes (OOP) and functions (Functional/Modular)**. It aims to have pure and simple functions for everything, but sometimes classes are simply the best and most flexible way to go.
  * Example: instead of a function `rotate` on every possible shape, we just have a single pure `rotatePath` _function_ that takes any input and gives it back rotated.
  * Example: all resources (loaded images, fonts, etc) are _classes_, because they are "persistent things". They're large data containers that you load, and pass around, and re-use.
  * The general code architecture is to do things through _functions_, but with _dependency injection_; where the dependencies are often classes holding all the specific data and functionality.
* At the heart of all functionality is a single **config object**. All you need to define your game and start the generator, is to pass in an object (key-value pairs) that tells it what to do. 
  * This means there are a handful of "protected" names inside that object you need to learn (such as `_settings` always containing your configurable settings). 
  * It also means very clear code that 100% defines your project in a single plain text file.
* This philosophy is extended to arguments/constructors too. Almost everything accepts a **single object with properties**, where order doesn't matter and you can leave out lots of stuff and get sensible defaults.
  * Example: instead of `drawThisThing(position, rotation, scale, ...)`---which requires knowing all arguments and their order, possibly forced to input them all---we have `drawThisThing({ scale: XX, rotation: YY })` and anything not mentioned receives expected defaults.
* It uses **TypeScript** and modern `import`/`export` features to modularize everything. Your final JS bundle should only contain the specific things you actually used, nothing else. You never need to know the actual path or folder structure of the library, as you can import everything from the global `pq-games` level.
  * This was a massive mistake I made with v1. All those games imported the specific thing they needed from its specific folder path. Which meant any change to files/folders/hierarchy ... any change at all ... broke lots of stuff and required tons of refactoring. No more!
  * Unfortunately, my Pandaqi website uses ESBuild (through Hugo) which turned out to have some terrible bundling bugs, so the JS on that website still ends up including nearly the whole darn library. If you use any other bundler, it should tree shake/optimize the heck out of this framework.
* There are **no dependencies**. Any other libraries used---however rare---are simply included as another file in the framework. So this system doesn't require node, it doesn't need to install anything else, it just works as it is.
  * It's all "one framework" because that simplifies lots of things for me, my computer, and the delivery pipeline of my online store. But it's as modular as possible, which means this is effectively a handful of standalone libraries for one specific purpose in a trenchcoat.
* This framework, for example, supports loads of complicated **text formatting**. Inline images. Changing colors and sizes at any moment. Text wrapping, centering however you like, etcetera. Many board games require these kinds of things, yet no other framework really does them, so I had to build that all from scratch.
  * Whenever in doubt, you can assume the framework did things in whatever way was _most practical_. Text is center-aligned by default, as that's what I needed 90% of the time. Images are center-aligned by default too (instead of top-left), as that's what I needed 95% of the time.

If you simply place this whole library inside your project, TypeScript will allow you to see names and types for everything. These are mostly self-explanatory. I code in a way that is a bit slower and more verbose, which rewards you by having the code explain itself every step of the way. 

I don't write JSDOC comments (or many comments at all) as my hyperactive brain heavily dislikes reading code formatted like that. If this system grows large/popular enough, though, I will certainly use some strict and automatic documentation generator. I can change and learn, but I need strong incentive ;)

As such, for detailed information, check the DOCS below. Because this is a complete overhaul after 5 years of experimentation with v1, where I decided to "do things right", I believe the syntax won't change so often that it's a waste of time to write this manually.

## The Core Loop

At its core, the system has the following loop.

* **INIT:** Initialize _settings_ interface. When "Generate!" button pressed ...
* **PICK:** Your custom "picker" function is called and should return a list of objects (cards, tokens, tiles, ...) to create.
* **DRAW:** The items in this list are then drawn in batches. This turns the object into its final visual/image, using a single "visualizer" object being passed around that has all the data you need. (It's batched to allow giving progress feedback and prevent blocking the browser.)
* **MAP:** This maps all these individual drawings of items to actual pages (placing them in a proper grid, double-sided support, etc)
* **PDF:** This is all collected inside a PDF, which is then automatically downloaded.

The main settings the system requires are all set in your big "config" object. For example, that's where you set the default page size, or how many cards you want per page, or where exactly to place that piece of text on every card.

Any further (custom) functionality must be provided by you by hooking up your own code. That code can do _anything_ it wants, as long as "pickers" return a list of objects, and "drawers" return a final image.

The code for this is ... `loadGame(CONFIG)`

That's it. Call that with your configuration object, it inserts itself into the page (when it's done loading), and you're good to go.

Which means it's time to talk about the real magic: that configuration file.

## The Big Config

All top-level config properties reserved by the system have an underscore before them (e.g. `_settings`). This is to remind you not to mess around with them, but that the system _will_ read and mess around with them as it generates stuff ;)

You can do whatever else you want with this object, as long as the data for these properties is input as you want/as the system expects.

### Game

This is the place for global settings touching on the entire game generation/configuration as a whole.

* `name` (string): Name of the game/generator.
* `renderer` (Renderer): the Renderer to use. (Default = RendererPandaqi)
* `resLoader` (ResourceLoader): the object used to load resources. (Default = will create one on the fly as needed, so you basically never have to set this yourself)
* `localStorageKey` (string): if you have settings saved in LocalStorage, it reads them from this key and adds them to the config
* `fileName` (string): name of the file produced. (Default = uses the `name`)
* `noDefaultSettings` (boolean): doesn't insert any of the default settings (seed, custom resources, page size, ink friendly, ...)
* `noUploadingCustomResources` (boolean): forbids inserting an input to upload custom resources. (This is required if not hosting this on a server, as that's the only way to make the browser "trust" the images/fonts.)
* `noInkFriendly` (boolean): turns off the ability to generate an "ink friendly" version of the game
* `noSeed` (boolean): turns off the ability to make the generation seeded (identical seed = identical output)
* `pageSides` (PageSides): default page binding setting (double-sided or single-sided printing)

### Settings

Anything placed here is turned into a setting displayed at the start of the program.

New inputs are simply objects (like everything else) with the following possible key-value pairs.

* `type` (SettingType): whether it's a checkbox, a number, etc
* `label` (string): the "human readable" text to display next to the input
* `remark` (string): extra explanation/clarification revealed when hovering over the tooltip icon
* `default` (any): the default value of this input. (Alias = `value`)
* `values` (string[]): the possible values of this input
* `min` (number): minimum value (if numeric input)
* `max` (number): maximum value (if numeric input)
* `step` (number): the intervals between possible values you can choose from
* `placeholder` (string): placeholder text inside text inputs (as long as nothing has been entered yet)

Possible setting types are ...

* `SettingType.GROUP`: marks its children as belonging to the same group/section (see below).
* `SettingType.TEXT`: freeform text input.
* `SettingType.NUMBER`: a number (possibly with min/max/step)
* `SettingType.CHECK`: a checkbox (boolean input; either true or false, yes or no)
* `SettingType.ENUM`: a list of things to choose from (a "dropdown menu" if you want)
* `SettingType.INPUT`: a file upload box
* `SettingType.MULTI`: presents multiple checkboxes and all of them can be toggled on/off _independently_. Its output is a list that contains only the elements _turned on_.

The `defaults` key will automatically hold the default settings you'll want for almost all games. It contains the following keys.

* `resources`: returns a FileList with custom resources you decided to upload.
* `pageSize` (PageSize)
* `pageSides` (PageSides)
* `itemSize` (ItemSize)
* `inkFriendly` (boolean)
* `seed` (string)
* `splitDims` (string): the options are a list of strings like "1x1" and "2x2" dimensions for splitting
* `language` (string): default language in case you want to support multiple languages

You can also create sub-groups. These will result in neat foldable (sub)sections. To do so, simply put these inputs inside another object, and give it the property `type: SettingType.GROUP`. (The property `folded: true/false` makes the section start folded or unfolded.)

Upon generating, the **final value the user put in** is placed into this object at the `value` property. 

This means you can access these values whenever you want inside the program at the _exact same path_. Example: if you added a setting called `numberOfCards` inside the subgroup `quantities`, you can access it during generation with `config._settings.quantities.numberOfCards.value`.

_Remark:_ In older versions, the output/chosen value actually replaced the entire object. Yes, this shortened the paths because you could drop that final `.value`. But it had the downside of mutating the config and losing data. 

What if you wanted to know the min/max of some setting during generation? What if you wanted to keep re-generating with same/different settings without reloading? You couldn't! Because that whole object would be replaced by the final value at that time! And so it was changed. Slightly more verbose, much cleaner and less error-prone. 

If you still want a "quick" way to access values, use the `getSetting(path.to.it, config)` helper function. In the case of our previous example, it would be `getSetting(quantities.numberOfCards, config)`.

### Material

This contains the different kinds of material you want to generate. Every different kind should be a new key-value pair, where the value is an object that can have the following properties.

* `picker`: any function that returns the different items in your game. (Example: a bunch of `Card` class instances for a card game.)
* `mapper`: a `MapperConfig` explaining how to place those individual items on the page. (Example: in rectangular grids, 3x3 per page, etcetera.)
* `visualizer`: a custom visualizer class, which is the only thing automatically put into the draw call of each item. (The default `MaterialVisualizer` will probably be all you need; this is merely a custom override when needed.)
* `splitDims`: custom splitDims _for this material only_. (The default setting is global, applied to everything.)
* `fileName`: a custom fileName _for this material only_. (The generator tries to keep everything inside one PDF, but is forced to create multiple ones if sizes/orientation don't match.)
* `frontDefault`: any class with a `draw` function. The result of that is saved and re-used as the front of _all items_. (This is very efficient if you know all items have the same front.)
* `backDefault`: any class with a `draw` function. The result of that is saved and re-used as the back of _all items_. (This is very efficient if you know all items have the same back.)

The `MapperConfig` offers the following options.

* `preset` (MapperPreset): pick one of the presets and you don't have to set all the other things anymore.
* `autoStroke` (boolean): add a thin black stroke around all items to help cutting them out (default = true)
* `sizeElement` (Vector2): the aspect ratio of elements. (For example: perfectly square tiles would be `Vector2(1,1)`)
* `size` (Vector2): the dimensions of the grid. (For example, to place 3x4 cards on each PDF page, use `Vector2(3,4)`)
* `sizeGridForced` (Vector2): forces the grid to be this dimension, ignoring any other settings.
* `margin` (Vector2): the empty margins at the edge of the page. (Default = the common margin for most printers)
* `pageSize` (PageSize): overrides the globally set page size for the generator
* `pageOrientation` (PageOrientation): overrides the globally set page orientation

@TODO: Give the possible options for MapperPreset, PageSize, PageOrientation, etc?

### Drawing

The `MaterialVisualizer` only allows access to properties inside this object. I limited it like this based on experience: it's more efficient and helps prevent accidental mistakes/overreach by having access to the entire config.

It automatically reads all values inside and "prepares" them for ease of use when coding _how_ it should "visualize the material".

Why is this important? Because the generator allows drawing things at wildly different sizes, page orientations, etcetera. The visualizer "pre-multiplies" values with the requested size to automatically scale your material up and down. This scaling can now happen in a "native" way that doesn't cause pixelation or is incredibly slow. (It even allows leaving out elements, scaling in some custom way, or anything else depending on the settings someone chooses.)

The MaterialVisualizer gives you some default values you'll need a lot of the time.

* `size` (Vector2): the target size of the item it's drawing
* `sizeUnit` (number): the _smallest side_ of that item
* `inkFriendly` (boolean): whether we're drawing ink friendly or not
* `center` (Vector2): the center of the item

Again, this is a very limited set of default values to keep things simple and bug-free. Everything else is manually defined by you based on the requirements of your project.

How do you define your own "dynamic" (or "scalable") value? With `new CVal(value, howItScales)`.

For example, say you have text on the material. You want that text to _scale_ based on the card size (so it always fits/has the same relative size). Then you might do:

```
_drawing:
{
  text:
  {
    fontSize: new CVal(0.1, "sizeUnit")    
  }
}
```

Finally, to actually draw your items, the system calls the `draw(vis)` function on your object. (Or `drawBack()` for the back side, if available.) Then, within the item, you can use `vis.get("text.fontSize")` whenever you need this pre-calculated value.

### Resources

This contains the resources you want to load (images, fonts, etc) and some general settings about how to do so.

The main properties are as follows.

* `base` (string): the path towards the asset folder (in case they are not in the same folder as the program)
* `filter` (Function: Resource -> boolean): only load resources for which the filter function returns _true_.
* `files` (object): the actual custom files you want to load.

The files are key-value pairs. The key is some unique ID that you will use throughout the game to refer to the resource. The value is an object with the parameters for loading it.

* `path` (string): path to the file. (It's recommended to just use the filename here and use `base` to get the full path)
* `useAbsolutePath` (string): bypass the `base` and anything else and just use the `path` as given.
* `frames` (Vector2): if it's a spritesheet, it cuts it into individual images based on this.
* `loadIf` (string[]): only load the resources if the config properties mentioned in the list resolve to a `true` value. 
* `numThumbnails` (number): if not 0, generates smaller and smaller thumbnails of the image to use whenever possible and make the process more efficient

There's no need to tell it the _type_ of resource or anything. It figures it out from the filename/path. In most cases, setting the path is really all you need to do.

You can now access these resources at any time in your drawing code with `vis.getResource(key)`.

### Generation

This contains many _detailed_ properties related to _specific parts_ of the generation process. 

* `visualizer`: custom visualizer to use for _everything_ (instead of MaterialVisualizer)
* `pageOrientation` (PageOrientation): default page orientation (`PageOrientation.PORTRAIT` vs `PageOrientation.LANDSCAPE`)
* `losslessPdf` (boolean): if true, doesn't compress the PDF. This makes HUGE PDFs but, well, makes the result look sharper and lossless.
* `batchSize` (number): the number of items to draw per "batch". (Default = some sensible middle ground. Higher number = less overhead per batch, but blocks your browser and/or may make it crash.)
* `noBatching` (boolean): just turn the whole batching system off
* `possibleSplitDims` (string[]): the splitDims allowed to be chosen
* `possiblePageSizes` (PageSize[]): the PageSizes allowed to be chosen
* `possiblePageSides` (PageSides[]): the PageSides (double-sided/single-sided) allowed to be chosen
* `possibleItemSizes` (ItemSize[]) the ItemSizes allowed to be chosen.

It's also recommended to put any of your own custom generation settings (unrelated to drawing) here. Even if something is not exposed as a setting, it's still good practice to put it in the config file under a self-explanatory name. 

Example: I have a game that always creates material for 4 players. Then I'd still add `_generation.numPlayers: 4` to config and _read_ that value instead of baking it into the code, which makes it hard to find and change later.

### Translation

You can support generating the game for multiple languages.

The top-level properties are as follows.

* `language` (string): custom default language to use for translations (otherwise just picks first key; overriden by setting if enabled)
* `delimitersReplace` ({ pre: string, post: string }): which symbol to use to mark a string as needing to be replaced. (Default = `%` and `%`)
* `delimitersTranslate` ({ pre: string, post: string }): which symbol to use to mark a string as needing to be translated further/too. (Default = `` ` `` and `` ` ``)
* `dictionary` (object): the keys are all possible language codes (e.g. `en` for English and `nl` for Dutch). Their values are key-value pairs, where the key can be invented by you, and the value is the string to return.

For example, maybe I have a type of card in my game that represents money. Then I might say `nl: { money: "Geld" }` to give the translation in Dutch.

To actually use that translation, call `vis.getTranslated(money)`

Most of the time, however, a hard-coded string will be cumbersome. You want to replace multiple things by dynamic values as you translate. That's where those "delimiters" come in.

* You can mark parts of the translation as a "dynamic value" by putting the delimiters around it: `nl: { money: "%num% Geld" }`
* Then pass in parameters for how to replace that value: `{ num: someVariableIJustCalculated }`

Now I can call `vis.getTranslated("money", { num: 10 })` and get back `"10 Geld"` (if the language setting is set to Dutch), which is just a string I can place as usual. 

For even more easy of use, you can put multiple "sub-translations" into a translation. For example, I can say `To [objective] the game you need to have %num% [money]`. It will search for "objective" and "money" in the same translation dictionary and translate those on their own.

@TODO: I intend to add more advanced support for translation in the future (e.g. auto-translating _all_ text you draw). But this system was the last to be added, so it's barebones for now.

### Debug

This section is for you, the developer. Make sure not to accidentally leave any debug stuff turned on when generating your final PDF ;)

* `onlyGenerate` (boolean): only generates your items, but doesn't actually draw them
* `singleDrawPerType` (boolean): only draws each item type once. (It just does a basic check on a `type` variable inside your item class. This is merely useful for quick debugging if all the different types of material generate properly _without_ having to generate the whole thing each time.)
* `omitFile` (boolean): if true, no PDF is created and downloaded. (Instead, the final images are appended to the page itself so you can still see them immediately.)
* `filterResources` (string[]): if not empty, the system only loads the resources inside (by key), saving you time or allowing you to focus on just one problematic resource.
* `profile` (boolean): if true, profiles how long the entire process takes. (@TODO: Want to profile more specifically than this in the future.)
* `text` (boolean): if true, outlines of text boxes are visible and debug info about their calculated properties/chunks is logged
* `picker` (boolean): if true, logs the output from material pickers
* `mapper` (boolean): if true, outlines from GridMapper show how it's placing stuff + more logging
* `visualizer` (boolean): if true, debugs the MaterialVisualizer (mostly logs the CVal/pre-multiplied values it created)
* `layoutOperation` (boolean): @TODO implemented but doesn't actually do anything right now

## How To Draw Anything

By understanding the big Config section above, you already know how 99% of the system works and what to turn on/off to make it do what you want.

This, however, leaves out the other piece of the puzzle: the actual, specific, custom drawing code to tell it what your game material looks like.

Within your `draw` function (on the object that represents an item in your game, e.g. `Card` or `Tile`) you'll need a whopping two lines of boilerplate. This boilerplate only exists to allow swapping out renderers at will and possibly support more renderers in the future.

```
async draw(vis:MaterialVisualizer)
{
  const group = vis.prepareDraw();
  // DO YOUR STUFF!
  return await vis.finishDraw(group);
}
```

At its core, drawing anything has two parts: **what** to draw + **how** to draw it.

The _what_ has already been shown: those are `Resource`s. Any image assets are `ResourceImage` objects, any text is a `ResourceText` object, and the `ResourceGroup` simply contains other resources as its children. That's what allows us to put the entire drawing code for an item into one _group_ and just draw the whole thing once done.

The _how_ is handled by the `LayoutOperation` class. It has all the usual features (position, rotation, scale) and quite some more.

To draw anything, you merely need to state the resource and the operation.

```
const res = vis.getResource("someimageiguess");
const op = new LayoutOperation({
  pos: new Vector2(50, 100),
  rot: Math.PI,
  alpha: 0.5
});
group.add(res, op);
```

That's it. Leave out any properties you don't need. The beauty of this system is that it also allows reusing that resource or operation. (Perhaps after cloning it and making slight modifications.)

There's only _one_ default to be wary of: the `pivot` is always CENTER, or `Vector2(0.5, 0.5)`. (It started as the expected _top left_, but after 5+ years of using this system, I probably needed _top left_ only 1% of the time. So I changed it.) This means that anything will be positioned such that your `pos` is the _center_ of that object. You can change it, of course, by setting the `pivot` property to something else.

@TODO: In the future I might also support "function chaining" for defining the operation. Example: `new LayoutOperation().pos(value).rot(value).alpha(0.5)` I simply chose this syntax first and wanted to finish this whole system before providing syntactic sugar.

## Extra Information

### Renderers

The system currently has 2 renderers: `RendererPandaqi` and `RendererPixi`.

The first one uses _canvas_ and is completely written by me. It's the default. Because it doesn't use WebGL or anything else, it works even on the crappiest of browsers, and is faster/more stable when drawing maybe hundreds of cards at the same time and putting them in the same PDF.

The second one uses the well-known PIXIJs framework and its modern WebGL capabilities. It's much faster on larger and more complicated single drawings, such as a huge playing board (perhaps even split into 4 pages) for a game. It would also allow me to support many more advanced/modern features in the future.

They are on 99% feature parity. Just some edge cases and exceptions that hasn't allowed me to make performance 100% identical (yet).

You can literally put in any renderer, while leaving your code the same, and it works.

_Why two renderers then?_ 

* First of all, Pixi is huge and I don't want to include it in every bundle if I can help it. As long as you don't use that renderer, all its code is just ignored when bundling your app.
* Secondly, there used to be _four_ renderers. This used to be a massive part of the system! The first thing I explained in the DOCS!
  * I used the Phaser framework for years on Pandaqi to generate material. To untangle myself from it, I made a simple step-by-step plan: support multiple renderers, isolate all Phaser code inside `RendererPhaser`, translate to `RendererPixi` (the backend that Phaser uses anyway), and tada we finally got rid of it. (Phaser is even _more huge_ than Pixi and really meant for interactive games not printable PDFs. If I ever create video games on Pandaqi again I'd probably create a different library for it.)
  * I also had a `RendererHTML` that was very flawed and bad and ugly until I removed it and supported HTML output in a much smarter way. (All Resources have a `toHTML` function besides their `toCanvas`.)
* Thirdly, the performance difference on large complicated designs is simply massive. Supporting Pixi made me able to generate my One Paper Games in half a second again instead of waiting a minute.

### Color

Whenever you can input a color in this system, it can be a hexadecimal string (e.g. `"#FF0000"` for red) or a `Color` object. Once a color is in the system, it is _always_ a `Color` object.

Colors are saved (by default) in the HSLA format. It provides the most powerful and practical ways to manipulate and read colors. But there are functions for converting to and from literally any other format.

Many places accept a superset called `ColorLike`, which also includes `ResourcePattern` and `ResourceGradient`. Because many operations in the Canvas can apply a _gradient_ instead of a solid color. This is, however, mostly untested and underdeveloped as I never ended up having to use it (yet).

As always, the `Color` object is very small and minimal. For color manipulation/transformation/tools you can use a breadth of small modular functions to import as needed. It also contains a number of _named_ colors you can access anywhere, such as `Color.BLACK` and `Color.TRANSPARENT`.

### LayoutOperation

Below is a list of all the individual properties in LayoutOperation. There are so many that I categorized them further, but they're all top-level properties you can set directly on the object.

#### Transform

* `pos` (Vector2): the position to draw the resource. (Alias = `position`)
* `rot` (Vector2): how much to rotate the resource. (Alias = `rotation`.)
* `scale` (Vector2): how much to scale the resource
* `size` (Vector2): the actual size of the resource 
* `sizeAuto` (boolean): if true, resizes the resource (while keeping aspect ratio) to fit
* `pivot` (Vector2): where to place the center of the resource => default is `Vector2(0.5)`, top left would be `Vector2(0)`, bottom right would be `Vector2(1)`
* `skew` (Vector2): how much to skew the resource
* `flipX`/`flipY` (boolean): easy ways to flip/mirror the resource along an axis

#### Blend

* `alpha` (number): 0 means completely transparent, 1 means completely opaque
* `composite` (GlobalCompositeOperation): how to blend this new resource with what's already on the canvas below it 

#### Clip

* `clip` (Path): clips the resource so it only draws what's _within_ the Path's absolute coordinates
* `clipRelative` (boolean): if true, the Path's coordinates are taken to be _relative_ to where the resource is being drawn 
* `mask` ({ resource: Resource, operation: LayoutOperation }): basically same as clip, but more powerful because you can now use images and it will only display whatever is inside the mask

#### Display

* `frame` (number): if the resource is an image with multiple frames, this selects the specific one to draw
* `effects` (LayoutEffect[]): a list of effects to apply. The system has a large set of built-in effects, but you can easily write your own that extends `LayoutEffect`.
* `tint` (Color): this effect is so common/powerful that I gave it a dedicated property.
* `fill` (ColorLike): the color with which to _fill_ the resource's area
* `stroke` (ColorLike): the color of the _stroke_ around the resource's area
* `strokeWidth` (number): thickness of the stroke
* `strokeAlign` (StrokeAlign): whether to align stroke to the `StrokeAlign.MIDDLE`, `StrokeAlign.INSIDE` or `StrokeAlign.OUTSIDE` (my preference)

#### Automatic Properties

There are some properties that are set automatically by the system as it works its magic. You can, however, access/override with custom things if needed.

* `resource` (Resource): the resource to draw
* `renderer` (Renderer): a custom renderer to use (instead of the one automatically assigned by system)
* `parentOperation` (LayoutOperation): the parent (group) that contains this operation; its transform matrix is multiplied with that of its child to get the final absolute position on the canvas.
* `inline` (boolean): if true, all changes made to the contex/canvas are temporary and destroyed upon exit. (This is used for operations taking place "inline"---in the midst of---another operation, such as inline images when drawing text)
* `textMetrics` (TextBoxMetrics): if drawing a ResourceText, it calculates the actual bounds and positioning of that text box and saves it here. (So it can reuse it later without having to recalculate.)

### Text Formatting

Text is complicated. Always has been, always will be. I tried my absolute best to create a powerful system with simple syntax, and I'll try to explain it succinctly.

Drawing text thus takes two steps.

* Create a `TextConfig` with the proper settings, such as _font family_, _font size_ and _alignment_.
* Create a `ResourceText` by giving it the specific text you want to display and your config.

In code, this looks something like this.

```
const cfg = new TextConfig({
  font: "Helvetica",
  size: 20
})
const res = new ResourceText("I want to display this!", cfg);
const op = new LayoutOperation({
  fill: Color.BLACK,

});

```

_Remark:_ In the old version, you had a third step. You had to make sure you set a `fill` and a `size` on the LayoutOperation. Otherwise the TextBox had no size and the system would complain it can't draw any letters in zero space or without color ;) In the new system, however, if you neglect these it will default to _black text_ and _auto sizing_ the text box to fit whatever you put in.

#### TextConfig

The following properties can be set in the text config.

* `size` (number): the font size in pixels. (Alias = `fontSize`)
* `font` (string): the actual font to use. (Alias = `fontFamily`)
* `alignHorizontal`/`alignVertical` (TextAlign): how to align the text. Default is _center align_, because that was the most common use case.
* `lineHeight` (number): the height of lines, relative to font size. This is typically some multiple like `1.2` to get a bit of space.
* `style` (TextStyle): either `TextStyle.NORMAL` or `TextStyle.ITALIC` (for _italics_).
* `weight` (TextWeight): any of `TextWeight.THIN`, `TextWeight.LIGHT`, `TextWeight.REGULAR`, `TextWeight.BOLD` (for **bold text**), or `TextWeight.BLACK`.
* `variant` (TextVariant): either `TextVariant.NORMAL` or `TextVariant.SMALLCAPS`
* `transform` (TextTransform): any of `TextTransform.NORMAL`, `TextTransform.UPPERCASE`, or `TextTransform.LOWERCASE`.
* `anchor` (TextAnchor): has the same properties as canvas's `.baseLine`, which determines how the text is anchored on the imaginary line (vertically). Best explained it an image; will probably never need to change this.
* `wrap` (boolean): if false, text never wraps to a new line (it ignores text box width). Default is true.
* `format` (boolean): if false, it interprets your text "as-is" without detecting tags and rich formatting. Default is true.

If you intend to have inline images, you can play with a few more properties (though the default settings for these are usually fine).

* `resLoader` (ResourceLoader): you MUST tell it about the resourceLoader, or it can't find the image resources to place!
* `defaultImageOperation` (LayoutOperation): a custom operation stating how to place this inline image.
* `heightToSizeRatio` (number): changes the default estimate on how large to make inline images (relative to text size)

#### Text Formatting

I hijacked HTML tags for the text formatting. It simply felt most natural, didn't clash with anything else, and turned out to be most practical. 

For example, if you want to make part of text bold, you can use `This is some <b>BOLD TEXT</b>.` You can feed this flat string to the text system and it will automatically chunk it and apply those styles as needed.

The possible tags are ...

* `\n` for forcing line breaks ("newlines") right there.
* `<i></i>` for italics. (Alias = `<em></em>`)
* `<b></b>` for bolding.
* `<sc></sc>` for small caps.
* `<img id="resourceID" frame="imageFrame">` for including an image (of the given ID, taking the given frame if applicable)
* `<size num="xx"></size>` for changing font size on the fly.
* `<font id="resourceID"></font>` for changing font family on the fly.
* `<col hex="xx"></col>` for changing text color on the fly.
* `<upper></upper>` for transforming to UPPER CASE.
* `<lower></lower>` for transforming to lower case.
* `<sup></sup>` for superscript.
* `<sub></sub>` for subscript.

### Geometry

Basically everything in this system uses the `Vector2` object. It's just a container of both an `x` and `y` value, but it's obviously very useful in a system about generating 2D layouts and visual designs.

Many things also use the `Path` object, or one of its specific Shape descendants (like `Rectangle` or `Circle`). 

Any other operations you might want to to with (2D) geometry can probably be found in the `geometry` folder. Merge paths, reverse paths, mirror paths, check intersections, arrange points in a line centered around something, etcetera.

As explained, the "objects" (or classes) are very minimal and lightweight. All functionality actually comes from small standalone functions you can import whenever and however.

In most cases, these tools are used for drawing simple basic shapes. 

For example, I might want a nice slightly off-white rectangle behind my text for legibility. 

```
const rect = new ResourceShape(new Rectangle({ center: somePosition, extents: someSize }));
const op = new LayoutOperation({ fill: "#EEEEEE" });
group.add(rect, op);
```

@TODO: This might split off into its own standalone library at some point. (As might other parts of this library, but this is the prime candidate.)