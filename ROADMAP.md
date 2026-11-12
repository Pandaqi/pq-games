# Roadmap / To-Do

This framework grew organically over many years, adding all the features I needed in practice. A large V1 -> V2 rewrite cleaned up the code immensely, but I mostly stuck to the same API and features to make the rewrite managable. The items below are therefore mostly optimization and code architecture improvements, none of which are "essential".

## Features

* LAYOUT: support setLineDash / dotted strokes
* TRANSLATION: Support for singular/plural distinction + translation of ALL text (that does NOT need any params) automatically

## Code Architecture / Quality

* **Mark things as /* @__PURE__ */** to help ESBuild. (This is only for _pure function invocations_. In other words, at the moment a function is called, and that function just returns a value and changes nothing else whatever the case, you can mark it pure.)
* REFACTOR by **breaking pq-games into standalone sub-libraries**.
* LayoutOperation
  * Break down into smaller submodules (e.g. pos/rot/scale collected in one _transform_ thing), so we only initialize/create what we actually use and need, and applying/creating this operation isn't a huge single chunk of code.
  * Create "function chain/builder" type of constructor => `layoutOperation.pos(xx).rot(yy).pivot(zz)` (Maybe use a LayoutOperationBuilder object as in-between to keep this functionality nicely separated)
  * IMPLEMENT the `_debug.layoutOperation` setting (which should be giving far more insight into what it's doing when something goes wrong)

## Tests / Dev

Fill the `dev-test` project with a proper suite of test commands for my Layout system (testing all details and major parts)

Then, do more rigorous tests/checks for ...

* [PossiblyFixed] FIX inline image position bug (after placing inline image, the text that follows is positioned wrong)
* [PossiblyFixed] FIX: not drawing anything at all when text overflows (if box is too small for text, it gives an error and shows nothing, but I changed it to at least try and draw it)
* [PossiblyFixed] FIX: If you re-use the same LayoutOperation for multiple ResourceTexts, the text string of _older ones_ bleeds into the new one SOMEHOW? (Noticed at Slippery Slopes word cards, where the `cat` (below, small) somehow used the same text as the main word.)

## Not Fully Implemented

* RendererPandaqi `depth` => because of how HTML Canvas works, actually depth sorting with this renderer might literally be ... impossible.
* RendererPixi `mask` => just need to read the docs and test

## Better Performance 

* Fewer local temporary garbage variables => https://www.html5gamedevs.com/topic/3869-what-makes-pixi-faster-than-easel/
* The caching did seem to help for the OPG system, especially combined with "thumbnailing"
  * Maybe the BATCHING needs to happen within the BoardVisualizer? (Instead of within a ResourceGroup?) => when I create those games, I just use different groups for different elements, and then hand that list of groups to the visualizer to draw _with some delay_?
* Support RE-ORDERING for better BATCHING.

## V1 -> V2 Migration Changelog

This is also a nice checklist for translating my old games to new system.

* Renamed `Point` to `Vector2` (we keep `point` as a nice variable name/descriptor and never confuse it with the Vector2 object)
* Do a check for every LayoutOperation that doesn't set a PIVOT => Default pivot is now center instead of top left => SHAPES are fine as they were always center-aligned anyway!
* Do a check for every TextConfig that doesn't set alignment in some way => Default alignment is now center instead of top left
* Update all pickers to be a _function_ instead of a class. (If any old game makes this impossible, just remove the generator from the website. Leave final files to be downloaded only.)
* Move all settings into the config (assets into `_resources`, all material into `_material` object, all drawing data into `_drawing`, etc)
* Moved most functions OUT of `Color` and into generally accessible `colorXX(c)` functions => should be low impact, didn't do many color manipulations before
* Made `Path` the main `Shape` class instead (solves all acyclic dependency fuckery and is just more sensible anyway) + moved its functions to generally accessible path functions instead
* Renamed `drawer` stuff (drawerConfig, GridSizePreset, etc) consistently to `Mapper` => MapperConfig, MapperPreset, etc
* Simply destroy all imports on everything, and let it auto-import from the main `lib/pq-games`. (Too many things changed name, location, folder, etc.)
* When done, all games should just be able to call `loadGame(CONFIG)` from their entry point and THAT'S IT