/**
 * @class SubCategoryList
 * @extends Graphics
 * @param {Object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} options.pixelRatio
 * @param {Texture} options.skin
 * @param {boolean} options.displayHeader
 * @param {{font:string,fill:string}} options.nameLabelStyle
 * @param {{font:string,fill:string}} options.deleteLabelStyle
 * @param {{font:string,fill:string}} options.addLabelStyle
 * @param {number} options.openOffset
 * @constructor
 */
App.SubCategoryList = function SubCategoryList(options)
{
    PIXI.DisplayObjectContainer.call(this);

    this.boundingBox = new App.Rectangle(0,0,options.width,0);

    this._model = null;
    this._mode = null;
    this._width = options.width;
    this._pixelRatio = options.pixelRatio;
    this._interactiveButton = null;
    if (options.displayHeader) this._header = this.addChild(new App.ListHeader("Sub-Categories",this._width,this._pixelRatio));
    this._buttonList = this.addChild(new App.List(App.Direction.Y));
    this._addNewButton = new App.AddNewButton("ADD SUB-CATEGORY",options.addLabelStyle,options.addButtonSkin,this._pixelRatio);
};

App.SubCategoryList.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);

/**
 * Update layout
 * @private
 */
App.SubCategoryList.prototype._render = function _render()
{
    if (this._header) this._buttonList.y = this._header.height;

    this.boundingBox.height = this._buttonList.y + this._buttonList.boundingBox.height;
};

/**
 * @method update
 * @param {App.Category} model
 * @param {string} mode
 */
App.SubCategoryList.prototype.update = function update(model,mode)
{
    this._model = model;

    this._buttonList.remove(this._addNewButton);

    var subCategories = model.subCategories,
        buttonPool = App.ViewLocator.getViewSegment(App.ViewName.SUB_CATEGORY_BUTTON_POOL),
        i = 0,
        l = this._buttonList.length,
        button = null;

    for (;i<l;i++) buttonPool.release(this._buttonList.removeItemAt(0));

    i = 0;
    l = subCategories.length;

    for (;i<l;)
    {
        button = buttonPool.allocate();
        button.update(subCategories[i++],mode);
        this._buttonList.add(button,false);
    }

    this._buttonList.add(this._addNewButton);

    this._buttonList.updateLayout();

    this._render();

    this._mode = mode;
};

/**
 * Called when swipe starts
 * @param {string} direction
 * @private
 */
App.SubCategoryList.prototype.swipeStart = function swipeStart(direction)
{
    var button = this._buttonList.getItemUnderPoint(this.stage.getTouchData());

    if (button && !(button instanceof App.AddNewButton))
    {
        this._interactiveButton = button;
        this._interactiveButton.swipeStart(direction);

        this.closeButtons(false);
    }
};

/**
 * Called when swipe ends
 * @private
 */
App.SubCategoryList.prototype.swipeEnd = function swipeEnd()
{
    if (this._interactiveButton)
    {
        this._interactiveButton.swipeEnd();
        this._interactiveButton = null;
    }
};

/**
 * Close opened buttons
 * @private
 */
App.SubCategoryList.prototype.closeButtons = function closeButtons(immediate)
{
    var i = 0,
        l = this._buttonList.length - 1,// last button is 'AddNewButton'
        button = null;

    for (;i<l;)
    {
        button = this._buttonList.getItemAt(i++);
        if (button !== this._interactiveButton) button.close(immediate);
    }
};

/**
 * Find and return item under point passed in
 * @param {InteractionData} data PointerData to get the position from
 */
App.SubCategoryList.prototype.getItemUnderPoint = function getItemUnderPoint(data)
{
    return this._buttonList.getItemUnderPoint(data);
};

/**
 * Test if position passed in falls within this list boundaries
 * @param {number} position
 * @returns {boolean}
 */
App.SubCategoryList.prototype.hitTest = function hitTest(position)
{
    return position >= this.y && position < this.y + this.boundingBox.height;
};
