# Module: mmm-hue-lights

The `mmm-hue-lights` module is a [MagicMirror](https://github.com/MichMich/MagicMirror) addon.

This module displays the status of your [Philips Hue](http://meethue.com) lights and light groups on your Magic Mirror and and supports multiple view types and modes.

![image](https://user-images.githubusercontent.com/3209660/49979103-2e3cd400-ff13-11e8-8f76-bc4c7d5e7b76.png)

*An example showing light groups on the left and lights on the right in the Grid view.*

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

Option             | Type      | Default    | Description
-------------------|-----------|------------|-------------------------------------------------------------
`bridgeIp`         | `string`  | -          | **This value is required for this module to work.**
`user`             | `string`  | -          | **This value is required for this module to work.**
`displayType`      | `string`  | `grid`     | `grid` or `list`
`displayMode`      | `string`  | `lights`   | `groups` or `lights`
`displayFilter`    | `array`   | `['all']`  | [Array of strings with names of lights/groups that you wish to **show**](#how-do-i-filter-which-lights-or-groups-to-show)
`hideFilter`       | `array`   | `[]`       | [Array of strings with names of lights/groups that you wish to **hide**](#how-do-i-filter-which-lights-or-groups-to-show)
`hideOff`          | `boolean` | `false`    | Whether to hide lights that are off
`updateInterval`   | `int`     | `120000`   | How often to load new data, default is 2 minutes
`initialLoadDelay` | `int`     | `0`        | How long to delay the initial load (in ms)


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

![image](https://user-images.githubusercontent.com/3209660/49979206-a3100e00-ff13-11e8-94f2-d0e1a7c1d87f.png)

#### Minimal

With `minimalGrid` set to `true`.

![image](https://user-images.githubusercontent.com/3209660/49979288-05690e80-ff14-11e8-9e7e-4032e978f444.png)

#### Ultra Minimal

With `minimalGridUltra` set to `true`.
Please note that this will only work if your `displayMode` is set to `lights`.

![image](https://user-images.githubusercontent.com/3209660/49979359-4c570400-ff14-11e8-8c16-503c91e85d2c.png)

### List View

#### Default (Colored)

With `coloredList` set to `true`.

![image](https://user-images.githubusercontent.com/3209660/49979457-b66fa900-ff14-11e8-8241-1467036301f2.png)

#### Default (B&W)

With `coloredList` set to `false`.

![image](https://user-images.githubusercontent.com/3209660/49979485-da32ef00-ff14-11e8-8e54-5c3cd13ddbae.png)

#### Minimal

With `minimalList` set to `true` and `alignment` set to `right`.

![image](https://user-images.githubusercontent.com/3209660/49979630-7fe65e00-ff15-11e8-94e1-b39250b10ecb.png)

![image](https://user-images.githubusercontent.com/3209660/49979620-752bc900-ff15-11e8-8b3a-f280ecc16948.png)


## FAQ

### How do I filter which lights or groups to show?

You have two options:

1) `displayFilter` - which filters lights/groups based on which of them you want to **show**
2) `hideFilter` -  which filters lights/groups based on which of them you want to **hide**

The default for this module is for the `displayFilter` to be set to `['all']` and for the `hideFilter` to be empty which shows all your lights and light groups.

Both the `displayFilter` and `hideFilter` options accept an `array` with 1 or more `strings`.

If, for instance, you only wish to see lights or groups named `living room`, update `displayFilter` to:
```js
displayFilter: ['living room']
```

You can add multiple strings to the filter - like so:
```js
displayFilter: ['living room', 'office']
```

This will now display all lights or groups named either `living room` or `office` (the filter is not case-sensitive, so `OFFICE` would work as well).

The `hideFilter` works the same way, but in reverse - if you set it to:

```js
hideFilter: ['living room']
```

Any lights or light groups named `living room` will now be hidden.

You can combine the two filters for ultimate flexibility in regards to which lights or light groups you wish to show.


### In the grid view is there any way to show the lights or light groups horizontally across the screen?

Something like this?

![image](https://user-images.githubusercontent.com/3209660/49984456-ca73d480-ff2d-11e8-92de-acafde227895.png)

Sure - do the following two things:

1) Set the `position` of the module to one of the full-width horizonal positions (`top_bar`, `middle_center` or `bottom_bar`).
2) Add the following to your `custom.css` file in MagicMirror's `css` folder:

```css
.mmm-hue-lights .grid {
    width: auto;
    display: flex;
    flex-flow: row wrap;
    margin: -10px;
    max-width: none;
    justify-content: center;
}

.mmm-hue-lights .grid .hue {
    width: calc(33.33% - 20px);
    margin: 10px;
    display: block;
}
```

The `33.33%` above means you'll have 3 lights across the screen. If you want 4, change to `25%`. If you want 5, change to `20%`, etc.

### The colors don't exactly match what's shown in the Hue App

The colors that are shown in this module are an approximation of the colors you'd see in the Hue app. There are some rather funky algorithms going on behind the scenes in the Hue app which I, unfortunately, don't have access to, so these color values should be considered best calculations based on the available data.


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