/**
 * @class InputScrollScreen
 * @extends Screen
 * @param {Transaction} model
 * @param {Object} layout
 * @constructor
 */
App.InputScrollScreen = function InputScrollScreen(model,layout)
{
    App.Screen.call(this,model,layout,0.4);

    //TODO add other 'scroll-' properties into TweenProxy?
    this._scrollTween = new App.TweenProxy(0.5,App.Easing.outExpo,0,App.ModelLocator.getProxy(App.ModelName.EVENT_LISTENER_POOL));
    this._scrollState = App.TransitionState.HIDDEN;
    this._scrollInput = null;
    this._scrollPosition = 0;
    this._inputPadding = Math.round(10 * layout.pixelRatio);
};

App.InputScrollScreen.prototype = Object.create(App.Screen.prototype);
App.InputScrollScreen.prototype.constructor = App.InputScrollScreen;

/**
 * On tick
 * @private
 */
App.InputScrollScreen.prototype._onTick = function _onTick()
{
    App.Screen.prototype._onTick.call(this);

    if (this._scrollTween.isRunning()) this._onScrollTweenUpdate();
};

/**
 * On scroll tween update
 * @private
 */
App.InputScrollScreen.prototype._onScrollTweenUpdate = function _onScrollTweenUpdate()
{
    var TransitionState = App.TransitionState;
    if (this._scrollState === TransitionState.SHOWING)
    {
        this._pane.y = -Math.round((this._scrollPosition + this._container.y) * this._scrollTween.progress);
    }
    else if (this._scrollState === TransitionState.HIDING)
    {
        this._pane.y = -Math.round((this._scrollPosition + this._container.y) * (1 - this._scrollTween.progress));
    }
};

/**
 * On scroll tween complete
 * @private
 */
App.InputScrollScreen.prototype._onScrollTweenComplete = function _onScrollTweenComplete()
{
    var TransitionState = App.TransitionState;

    this._onScrollTweenUpdate();

    if (this._scrollState === TransitionState.SHOWING)
    {
        this._scrollState = TransitionState.SHOWN;

        this._scrollInput.enable();
        this._scrollInput.focus();
    }
    else if (this._scrollState === TransitionState.HIDING)
    {
        this._scrollState = TransitionState.HIDDEN;

        this._pane.enable();

        App.ViewLocator.getViewSegment(App.ViewName.APPLICATION_VIEW).scrollTo(0);
    }
};

/**
 * Focus budget
 * @private
 */
App.InputScrollScreen.prototype._focusInput = function _focusInput()
{
    var TransitionState = App.TransitionState;
    if (this._scrollState === TransitionState.HIDDEN || this._scrollState === TransitionState.HIDING)
    {
        this._scrollState = TransitionState.SHOWING;

        this._pane.disable();

        this._scrollPosition = this._scrollInput.y - this._inputPadding;

        this._scrollTween.start();
    }
};

/**
 * On budget field blur
 * @private
 */
App.InputScrollScreen.prototype._onInputBlur = function _onInputBlur()
{
    var TransitionState = App.TransitionState;
    if (this._scrollState === TransitionState.SHOWN || this._scrollState === TransitionState.SHOWING)
    {
        this._scrollState = TransitionState.HIDING;

        this._scrollInput.disable();
        this._scrollTween.restart();

        if (this._scrollPosition  > 0)
        {
            this._scrollTween.restart();
        }
        else
        {
            this._pane.resetScroll();
            this._onScrollTweenComplete();
        }
    }
};