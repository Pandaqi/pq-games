# Documentation

What is PQ GAMES? It's the set of tools and libraries that powers my whole Pandaqi (Games) website.

These tools can, broadly speaking, be divided into two categories.

* For layout and design (Canvas, Layout, PDF, Website)
* For generation and logic (Tools)

The tools are mostly functions (sometimes classes) you can import directly to do very specific things I often need. (Geometric shapes or calculations, pathfinding, etcetera.) These are pretty standalone and don't need much explanation.

The layout portion needs the most explanation.

## Layout

On the web, we have three ways to design graphics.

* HTML + CSS
* Canvas
* SVG

The aim of the layout system is to provide _one_ simple, clear, unified system to define **styles**, which can be expressed in any of the three ways.

For example, I might create a Rectangle with a red fill. I want to be able to call `toHTML`, `toCanvas` or `toSVG` and get that exact visual idea in the chosen representation.

Similarly, I want to be able to define a layout as a tree (of nodes inside nodes), then use that in any way. (Export to HTML, stamp it on a canvas, etcetera.)

How do we do this?

### Resources

Anything that can be displayed is a _resource_. (_Asset_ was another option, but didn't fit with all applications.)

The possible resources are.

* `ResourceImage` => a fixed image. Can take in almost anything, but will always turn it into an image element (and chop it into frames if needed).
* `ResourceText` => for text. Takes in a TextConfig (font, size, alignment, ...) and the string to display. 
* `ResourceShape` => any geometric shape or path (rectangle, circle, ...). Takes in parameters, a set of points, or provides an interface to build paths on the fly.
* `ResourceGradient` => a gradient. Takes in color stops and a general config. (Most often, these will eventually be turned into ResourceImage to use as masks or backgrounds elsewhere.)
* `ResourcePattern` => the repeated usage of some visual element following certain rules.

REMARK: The `ResourceLoader` is responsible for loading external assets, such as images or fonts. Resources have no functionality themselves to load external files.

These all implement the three functions.

* `toHTML()`: converts it into one or more HTML nodes styled through CSS, returns the root of that DOM tree.
* `toCanvas()`: converts it into a drawing on a canvas, returns that
* `toSVG()`: converts it into an element usable within an `<svg>` tag

Where sensible, these also implement `from` functions. For example, ResourceImage has `fromCanvas`, `fromSVG`, etcetera.

### LayoutOperation

On its own, a resource has no other properties, such as its position or size. Instead, _how_ you want to draw the resource is defined with a different class: `LayoutOperation`.

These can be attached to resources (if you want to draw the same thing multiple times), or passed in as a one-time argument at the moment of drawing.

This is the meat of the system.

* `resource`: the actual resource to show (if empty, obviously nothing happens)
* `translate`: where to position the object's anchor
* `pivot`: where that anchor is (top-left or `(0,0)` by default). Given in relative coordinates (e.g. center is `(0.5, 0.5)`)
* `rotation`: how to rotate
* `scale`: relative scaling
* `dims`: absolute dimensions
* `flipX/flipY`: for mirroring
* `alpha`: opacity of object
* `composite`: the composite operation to use. (Should rarely need to touch this, mostly temporarily used by effects.)
* `clip`: a path for clipping
* `mask`: an image for masking
* `effects`: a list of effects to apply

If you call a function on a resource class, it automatically sets the resource parameter to itself. (No need to pass it in.) Depending on what it is, the operation does something else.

For example, an image would use the `drawImage` method to add itself to a canvas, or an `<img>` tag to add itself to a DOM tree.

For example, a shape would use the `Path2D()` interface to draw itself onto a canvas, or create the corresponding SVG element if added to a DOM tree.

### LayoutEffects

These are common effects such as `DropShadow` or `Tint`. They are classes and know how to apply themselves to the different outputs.

### Nodes

So far, this has all been on an individual level. This is used in my oldest games (way before I had a unified system or even knew what I was doing) or for one-off designs that don't need more structure.

Many layouts, however, consist of multiple elements. Containers within containers. You have a big header, and within you want something anchored to the bottom right, with even smaller stuff inside.

This can be created using the `Node` system. 

It's an almost complete copy of how CSS and HTML approach a structured layout. This means nodes follow the CSS box model: 

* Each node can have margin, padding, border.
* They support all CSS background magic.
* They support CSS layouts such as flexbox. 
* They can have any number of children that are placed "within" them.

What does my library do? It's a wrapper. It provides properties and names that show _intent_: what you wanted the design to look like. 

The implementation or supported browser systems might change---what the design was supposed to look like doesn't.

I might want to export something to Canvas now, but to SVG later, or something that isn't invented yet. But it doesn't matter: all previously created projects can keep using the same code, I merely switch what happens under the hood.

Without this, I'm writing thousands of lines of hardcoded CSS/Canvas/SVG syntax for each layout. It doesn't explain itself and it doesn't allow easy changes or updates down the line.

Because Resources are self-sufficient in drawing, and there's nothing else to do, there is only one `Node`.

If it gets a resource, it draws that (first). Otherwise it's just an empty box---a container or grouper for what's inside.

REMARK: I had a stab at writing my own implementation for the CSS flow logic. In the end, however, it proved too hard _and_ felt quite pointless. My system currently uses a third-party JS library to convert the HTML+CSS tree to canvas or SVG (using some `<foreignObject>` tricks, as far as I understand).

To _export_ the final result of such a node tree, call one of our familiar functions (`toCanvas()`, `toHTML` or `toSVG()`).





@CLEANUP:


* Remove propsInput/propsOutput in its entirety? (Or just keep it around without doing anything right now) => LayoutOperation is just fully responsible for this now


@FUTURE:

* If clip path enabled in LayoutOperation, apply stroke to THAT (not just image bounding box)
* Implement all the other common (CSS) filters and effects (e.g. grayscale for automatic inkfriendly)
* More complete implementation of the ColorClass and what it can do => then actually use it ( = allow as input) in all other places that work with color
* Actually implement details of ResourceGradient and ResourcePattern
  * Especially because I might want it for Quellector 
* Actually implement many details of toSVG
* Using SVG paths/filters/elements inside CSS properties should be really powerful ... if I can somehow connect the two easily
* Remove the need for those other two text functions; everything just uses a ResourceText
* Implement pointIsInsidePolygon + leftover Line functionality + basic algorithms for graphs (Prim's for connecting all, checking if everything is connected, etcetera.)