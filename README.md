# Module: mmm-hue-lights

The `mmm-hue-lights` module is a [MagicMirror](https://github.com/MichMich/MagicMirror) addon.

This module displays the status of your [Philips Hue](http://meethue.com) lights and light groups on your Magic Mirror and and supports multiple view types and modes.

TODO: add example
*An example showing ...*

## Installing the module
Run `git clone https://github.com/michael5r/mmm-hue-lights.git` from inside your `MagicMirror/modules` folder.

## Getting the Hue credentials
In order for you to have access to your Hue lights, you need a [Hue developer account](https://developers.meethue.com) and a couple of things:

- the `IP address` of the Hue bridge you're using
- an authorized `user` for your Hue bridge

Please follow the instructions on this page to get both:
https://www.developers.meethue.com/documentation/getting-started

If you don't have a Hue developer account already, click the `register` link on the page above to set one up (it's free).

## Using the module
To use this module, simply add it to the `modules` array in the MagicMirror `config/config.js` file:

```js
{
    module: 'mmm-hue-lights',
    position: 'top_right', // pick whichever position you want
    config: {
        bridgeIp: <HUE_BRIDGE_IP>,
        user: <HUE_BRIDGE_USER>,
        // ... and whatever else configuration options you want to use
    }
},
```

This module uses the excellent [Handlebars](http://handlebarsjs.com) library to serve up precompiled templates for the various designs. If you're just using this module **as is**, you don't need to do anything - this module already comes with all the templates you need.

If, however, you wish to modify the HTML structure of the module, read the [Using Handlebars](#using-handlebars) guide at the bottom of this page.


## General Configuration Options

Option             | Type      | Default   | Description
-------------------|-----------|-----------|-------------------------------------------------------------
`bridgeIp`         | `string`  | -         | **This value is required for this module to work.**
`user`             | `string`  | -         | **This value is required for this module to work.**
`displayType`      | `string`  | `grid`    | `grid` or `list`
`displayMode`      | `string`  | `lights`  | `groups` or `lights`
`displayFilter`    | `array`   | `['all']` | [Array of strings with names of lights/groups that you wish to show.](#how-do-i-filter-which-lights-or-groups-to-show)
`hideOff`          | `boolean` | `false`   | Whether to hide lights that are off
`updateInterval`   | `int`     | `120000`  | How often to load new data, default is 2 minutes
`initialLoadDelay` | `int`     | `0`       | How long to delay the initial load (in ms)


## Configuration Options specific to the Grid view

The following options only apply if your `displayType` has been set to `grid` - they have no effect on the list view:

Option             | Type      | Default   | Description
-------------------|-----------|-----------|-------------------------------------------------------------
`minimalGrid`      | `boolean` | `false`   | A more minimal look for the grid
`minimalGridUltra` | `boolean` | `false`   | An ultra-minimal look for the grid
`alignment`        | `string`  | `center`  | One of: `left`, `center`, `right`

**Note:** In the grid view, `alignment` only applies to the `minimalGridUltra` mode.


## Configuration Options specific to the List view

The following options only apply if your `displayType` has been set to `list` - they have no effect on the grid view:

Option             | Type       | Default   | Description
-------------------|------------|-----------|-------------------------------------------------------------
`minimalList`      | `boolean`  | `false`   | A more minimal look for the list
`coloredList`      | `boolean`  | `true`    | Whether to show the colors of your lights/groups in the list
`alignment`        | `string`   | `center`  | One of: `left`, `center`, `right`


## How It Looks

### Grid View

#### Default

TODO: add screenshot

#### Minimal

With `minimalGrid` set to `true`.

TODO: add screenshot

#### Ultra Minimal

With `minimalGridUltra` set to `true`.

TODO: add screenshot

### List View

#### Default

TODO: add screenshot

#### Minimal

With `minimalList` set to `true`.

TODO: add screenshot


## FAQ

### How do I filter which lights or groups to show?

The `displayFilter` option accepts an `array` with 1 or more `strings`. The default is `['all']` which displays all lights or all groups (depending on your `displayType`).

If, for instance, you only wish to see lights or groups named `living room`, update `displayFilter` to:
```js
displayFilter: ['living room']
```

You can add multiple strings to the filter - like so:
```js
displayFilter: ['living room', 'office']
```

This will now display all lights or groups named either `living room` or `office`. The filter is not case-sensitive, so `OFFICE` would work as well.

### The colors don't exactly match what's shown in the Hue App

The colors that are shown in this module are an approximation of the colors you'd see in the Hue app. There are some rather funky algorithms going on behind the scenes in the Hue app which I, unfortunately, don't have access to, so these colors values should be considered best guesses based on the available data.


## Using Handlebars

The Handlebars templates can all be found in the `templates` folder in the root of this module.

Before you do anything, if you don't have Handlebars installed, install it globally on your system:

```js
npm install handlebars -g
```

Make any changes you wish in the relevant `.hbs` files in the `templates` folder.

Once you're done, precompile all templates by running this in your terminal:
```js
handlebars <path-to-MM-modules>/mmm-hue-lights/templates/*.hbs -f <path-to-MM-modules>/mmm-hue-lights/mmm-hue-lights-templates.js -m
```

Make sure you replace `<path-to-MM-modules>` with the correct file path to your Magic Mirror `modules` folder.

If you have any problems, check out the [Handlebars](http://handlebarsjs.com/precompilation.html) documentation (or open an issue in this repo).