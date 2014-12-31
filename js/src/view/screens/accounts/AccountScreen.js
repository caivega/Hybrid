/**
 * @class AccountScreen
 * @extends Screen
 * @param {Collection} model
 * @param {Object} layout
 * @constructor
 */
App.AccountScreen = function AccountScreen(model,layout)
{
    App.Screen.call(this,model,layout,0.4);

    var i = 0, l = this._model.length(), AccountButton = App.AccountButton, button = null;

    this._buttons = new Array(l);
    this._buttonList = new App.TileList(App.Direction.Y,layout.height);

    for (;i<30;i++)
    {
        button = new AccountButton(this._model.getItemAt(0),this._layout,i);
        this._buttons[i] = button;
        this._buttonList.add(button);
    }
    this._buttonList.updateLayout();

    this._pane = new App.TilePane(App.ScrollPolicy.OFF,App.ScrollPolicy.AUTO,this._layout.width,this._layout.height,this._layout.pixelRatio);
    this._pane.setContent(this._buttonList);

    this.addChild(this._pane);
};

App.AccountScreen.prototype = Object.create(App.Screen.prototype);
App.AccountScreen.prototype.constructor = App.AccountScreen;

/**
 * Enable
 */
App.AccountScreen.prototype.enable = function enable()
{
    App.Screen.prototype.enable.call(this);

    this._pane.resetScroll();
    this._pane.enable();
};

/**
 * Click handler
 * @private
 */
App.AccountScreen.prototype._onClick = function _onClick()
{
    App.Controller.dispatchEvent(App.EventType.CHANGE_SCREEN,App.ScreenName.CATEGORY);
};

/**
 * Destroy
 */
App.AccountScreen.prototype.destroy = function destroy()
{
    App.Screen.prototype.destroy.call(this);

    this.disable();

    this.removeChild(this._pane);
    this._pane.destroy();
    this._pane = null;

    /*var i = 0, l = this._buttons.length, button = null;
    for (;i<l;)
    {
        button = this._buttons[i++];
        if (this._buttonList.contains(button)) this._buttonList.removeChild(button);
        button.destroy();
    }
    this._buttonList.destroy();
    this._buttonList = null;*/

    this._buttons.length = 0;
    this._buttons = null;
};