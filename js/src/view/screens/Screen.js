/**
 * Abstract Screen
 *
 * @class Screen
 * @extends DisplayObjectContainer
 * @param {Object} layout
 * @param {number} tweenDuration
 * @constructor
 */
App.Screen = function Screen(layout,tweenDuration)
{
    PIXI.DisplayObjectContainer.call(this);

    var ModelLocator = App.ModelLocator,
        ModelName = App.ModelName,
        pixelRatio = layout.pixelRatio;

    this._model = null;
    this._layout = layout;
    this._enabled = false;
    this._eventsRegistered = App.EventLevel.NONE;

    this._transitionState = App.TransitionState.HIDDEN;
    this._interactiveState = null;
    this._mouseDownPosition = null;
    this._mouseX = 0.0;
    this._mouseY = 0.0;
    this._leftSwipeThreshold = 15 * pixelRatio;
    this._rightSwipeThreshold = 5 * pixelRatio;
    this._clickThreshold = 5 * pixelRatio;
    this._swipeEnabled = false;
    this._preferScroll = true;
    this._mode = App.ScreenMode.DEFAULT;

    this._ticker = ModelLocator.getProxy(ModelName.TICKER);
    this._eventDispatcher = new App.EventDispatcher(ModelLocator.getProxy(ModelName.EVENT_LISTENER_POOL));
    this._showHideTween = new App.TweenProxy(tweenDuration,App.Easing.outExpo,0,ModelLocator.getProxy(ModelName.EVENT_LISTENER_POOL));

    this.alpha = 0.0;
};

App.Screen.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);

/**
 * Show
 */
App.Screen.prototype.show = function show()
{
    var TransitionState = App.TransitionState;

    if (this._transitionState === TransitionState.HIDDEN || this._transitionState === TransitionState.HIDING)
    {
        this.enable();

        this._transitionState = TransitionState.SHOWING;

        this._showHideTween.restart();

        this.visible = true;
    }
};

/**
 * Hide
 */
App.Screen.prototype.hide = function hide()
{
    var TransitionState = App.TransitionState;

    if (this._transitionState === TransitionState.SHOWN || this._transitionState === TransitionState.SHOWING)
    {
        this.disable();

        this._transitionState = TransitionState.HIDING;

        this._showHideTween.start(true);
    }
};

/**
 * Enable
 */
App.Screen.prototype.enable = function enable()
{
    if (!this._enabled)
    {
        this._registerEventListeners(App.EventLevel.LEVEL_1);

        this._enabled = true;
    }
};

/**
 * Disable
 */
App.Screen.prototype.disable = function disable()
{
    this._unRegisterEventListeners(App.EventLevel.LEVEL_2);

    this._enabled = false;

    this._interactiveState = null;
};

/**
 * Update
 */
App.Screen.prototype.update = function update(data,mode)
{
    this._mode = mode;
    //TODO mark layout/UI as 'dirty' and update/render on Tick event
};

/**
 * Add event listener
 * @param {string} eventType
 * @param {Object} scope
 * @param {Function} listener
 */
App.Screen.prototype.addEventListener = function addEventListener(eventType,scope,listener)
{
    this._eventDispatcher.addEventListener(eventType,scope,listener);
};

/**
 * Remove event listener
 * @param {string} eventType
 * @param {Object} scope
 * @param {Function} listener
 */
App.Screen.prototype.removeEventListener = function removeEventListener(eventType,scope,listener)
{
    this._eventDispatcher.removeEventListener(eventType,scope,listener);
};

/**
 * Register event listeners
 * @param {number} level
 * @private
 */
App.Screen.prototype._registerEventListeners = function _registerEventListeners(level)
{
    var EventLevel = App.EventLevel;

    if (level === EventLevel.LEVEL_1 && this._eventsRegistered !== EventLevel.LEVEL_1)
    {
        this._ticker.addEventListener(App.EventType.TICK,this,this._onTick);

        this._showHideTween.addEventListener(App.EventType.COMPLETE,this,this._onTweenComplete);
    }

    if (level === EventLevel.LEVEL_2 && this._eventsRegistered !== EventLevel.LEVEL_2)
    {
        if (App.Device.TOUCH_SUPPORTED)
        {
            this.touchstart = this._onPointerDown;
            this.touchend = this._onPointerUp;
            this.touchendoutside = this._onPointerUp;
        }
        else
        {
            this.mousedown = this._onPointerDown;
            this.mouseup = this._onPointerUp;
            this.mouseupoutside = this._onPointerUp;
        }

        App.ViewLocator.getViewSegment(App.ViewName.HEADER).addEventListener(App.EventType.CLICK,this,this._onHeaderClick);

        this.interactive = true;
    }

    this._eventsRegistered = level;
};

/**
 * UnRegister event listeners
 * @param {number} level
 * @private
 */
App.Screen.prototype._unRegisterEventListeners = function _unRegisterEventListeners(level)
{
    var EventLevel = App.EventLevel;

    if (level === EventLevel.LEVEL_1)
    {
        this._ticker.removeEventListener(App.EventType.TICK,this,this._onTick);

        this._showHideTween.removeEventListener(App.EventType.COMPLETE,this,this._onTweenComplete);

        this._eventsRegistered = EventLevel.NONE;
    }

    if (level === EventLevel.LEVEL_2)
    {
        this.interactive = false;

        App.ViewLocator.getViewSegment(App.ViewName.HEADER).removeEventListener(App.EventType.CLICK,this,this._onHeaderClick);

        if (App.Device.TOUCH_SUPPORTED)
        {
            this.touchstart = null;
            this.touchend = null;
            this.touchendoutside = null;
        }
        else
        {
            this.mousedown = null;
            this.mouseup = null;
            this.mouseupoutside = null;
        }

        this._eventsRegistered = EventLevel.LEVEL_1;
    }
};

/**
 * On tick
 * @private
 */
App.Screen.prototype._onTick = function _onTick()
{
    if (this._showHideTween.isRunning())
    {
        var TransitionState = App.TransitionState;

        if (this._transitionState === TransitionState.SHOWING) this.alpha = this._showHideTween.progress;
        else if (this._transitionState === TransitionState.HIDING) this.alpha = 1.0 - this._showHideTween.progress;
    }

    if (this._swipeEnabled && this._interactiveState === App.InteractiveState.DRAGGING) this._drag();
};

/**
 * On tween complete
 * @private
 */
App.Screen.prototype._onTweenComplete = function _onTweenComplete()
{
    var TransitionState = App.TransitionState;

    if (this._transitionState === TransitionState.SHOWING)
    {
        this._transitionState = TransitionState.SHOWN;

        this.alpha = 1.0;

        this._registerEventListeners(App.EventLevel.LEVEL_2);
    }
    else if (this._transitionState === TransitionState.HIDING)
    {
        this._transitionState = TransitionState.HIDDEN;

        this._unRegisterEventListeners(App.EventLevel.LEVEL_1);

        this.alpha = 0.0;

        this.visible = false;

        this._eventDispatcher.dispatchEvent(App.EventType.COMPLETE,{target:this,state:this._transitionState});
    }
};

/**
 * On pointer down
 *
 * @param {Object} data
 * @private
 */
App.Screen.prototype._onPointerDown = function _onPointerDown(data)
{
    if (this.stage)
    {
        this._mouseDownPosition = data.getLocalPosition(this.stage);
        this._mouseX = this._mouseDownPosition.x;
        this._mouseY = this._mouseDownPosition.y;
    }

    if (this._swipeEnabled) this._interactiveState = App.InteractiveState.DRAGGING;
};

/**
 * On pointer up
 * @param {Object} data
 * @private
 */
App.Screen.prototype._onPointerUp = function _onPointerUp(data)
{
    if (this._swipeEnabled)
    {
        if (this._interactiveState === App.InteractiveState.SWIPING) this._swipeEnd();
        this._interactiveState = null;
    }

    if (this.stage && this._mouseDownPosition && this._enabled)
    {
        var oldX = this._mouseDownPosition.x,
            oldY = this._mouseDownPosition.y;

        this._mouseDownPosition = data.getLocalPosition(this.stage,this._mouseDownPosition);

        var dx = oldX - this._mouseDownPosition.x,
            dy = oldY - this._mouseDownPosition.y,
            dist = dx * dx - dy * dy,
            TransitionState = App.TransitionState;

        if (Math.abs(dist) < this._clickThreshold && (this._transitionState === TransitionState.SHOWING || this._transitionState === TransitionState.SHOWN)) this._onClick();

        this._mouseDownPosition = null;
    }
};

/**
 * Drag
 * @private
 */
App.Screen.prototype._drag = function _drag()
{
    var InteractiveState = App.InteractiveState;

    if (this._interactiveState === InteractiveState.DRAGGING)
    {
        if (this.stage && this._mouseX)
        {
            var position = this.stage.getTouchPosition(),
                newX = position.x,
                newY = position.y;

            if (this._mouseX - newX > this._leftSwipeThreshold)
            {
                this._interactiveState = InteractiveState.SWIPING;
                this._swipeStart(Math.abs(this._mouseY-newY) > Math.abs(this._mouseX-newX) && this._preferScroll,App.Direction.LEFT);
            }
            else if (newX - this._mouseX > this._rightSwipeThreshold)
            {
                this._interactiveState = InteractiveState.SWIPING;
                this._swipeStart(Math.abs(this._mouseY-newY) > Math.abs(this._mouseX-newX) && this._preferScroll,App.Direction.RIGHT);
            }

            this._mouseX = newX;
            this._mouseY = newY;
        }
    }
};

/**
 * Click handler
 * @private
 */
App.Screen.prototype._onClick = function _onClick()
{
    this._eventDispatcher.dispatchEvent(App.EventType.CLICK);
};

/**
 * On Header click
 * @param {number} action
 * @private
 */
App.Screen.prototype._onHeaderClick = function _onHeaderClick(action)
{
    // Abstract
};

/**
 * Called when swipe starts
 * @param {boolean} [preferScroll=false]
 * @private
 */
App.Screen.prototype._swipeStart = function _swipeStart(preferScroll)
{
    // Abstract
};

/**
 * Called when swipe ends
 * @param {string} direction
 * @private
 */
App.Screen.prototype._swipeEnd = function _swipeEnd(direction)
{
    // Abstract
};
