/**
 * @class ColorSample
 * @extends Graphics
 * @param {number} modelIndex
 * @param {number} color
 * @param {number} pixelRatio
 * @constructor
 */
App.ColorSample = function ColorSample(modelIndex,color,pixelRatio)
{
    PIXI.Graphics.call(this);

    this.boundingBox = new App.Rectangle(0,0,Math.round(40*pixelRatio),Math.round(50*pixelRatio));

    this._modelIndex = modelIndex;
    this._pixelRatio = pixelRatio;
    this._color = color.toString();
    this._selected = false;

    this._render();
};

App.ColorSample.prototype = Object.create(PIXI.Graphics.prototype);

/**
 * Render
 * @private
 */
App.ColorSample.prototype._render = function _render()
{
    var xPadding = Math.round((this._selected ? 0 : 5) * this._pixelRatio),
        yPadding = Math.round((this._selected ? 5 : 10) * this._pixelRatio),
        w = this.boundingBox.width,
        h = this.boundingBox.height;

    this.clear();
    this.beginFill("0x"+this._color);
    this.drawRoundedRect(xPadding,yPadding,w-xPadding*2,h-yPadding*2,Math.round(5*this._pixelRatio));
    this.endFill();
};

/**
 * Set color
 * @param {number} index
 * @param {number} color
 * @param {number} selectedIndex
 */
App.ColorSample.prototype.setModel = function setModel(index,color,selectedIndex)
{
    this._modelIndex = index;
    this._color = color;

    this._selected = selectedIndex === this._modelIndex;

    this._render();
};

/**
 * Return model index
 * @return {number}
 */
App.ColorSample.prototype.getModelIndex = function getModelIndex()
{
    return this._modelIndex;
};

/**
 * Return value
 * @returns {string}
 */
App.ColorSample.prototype.getValue = function getValue()
{
    return this._color;
};

/**
 * Select
 * @param {number} selectedIndex Index of selected item in the collection
 */
App.ColorSample.prototype.select = function select(selectedIndex)
{
    var selected = this._modelIndex === selectedIndex;

    if (this._selected === selected) return;

    this._selected = selected;

    this._render();
};
