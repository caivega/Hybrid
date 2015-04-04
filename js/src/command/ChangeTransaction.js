/**
 * @class ChangeTransaction
 * @extends SequenceCommand
 * @param {ObjectPool} eventListenerPool
 * @constructor
 */
App.ChangeTransaction = function ChangeTransaction(eventListenerPool)
{
    App.SequenceCommand.call(this,false,eventListenerPool);
};

App.ChangeTransaction.prototype = Object.create(App.SequenceCommand.prototype);
App.ChangeTransaction.prototype.constructor = App.ChangeTransaction;

/**
 * Execute the command
 *
 * @method execute
 * @param {{nextCommand:Command,screenName:number}} data
 */
App.ChangeTransaction.prototype.execute = function execute(data)
{
    var EventType = App.EventType,
        ModelLocator = App.ModelLocator,
        ModelName = App.ModelName,
        settings = ModelLocator.getProxy(ModelName.SETTINGS),
        transactions = ModelLocator.getProxy(ModelName.TRANSACTIONS),
        transaction = transactions.getCurrent(),
        type = data.type;

    this._nextCommand = data.nextCommand;
    this._nextCommandData = data.nextCommandData;

    if (type === EventType.CREATE)
    {
        transaction = new App.Transaction();
        transactions.addItem(transaction);
        transactions.setCurrent(transaction);

        data.nextCommandData.updateData = transaction;
    }
    else if (type === EventType.COPY)
    {
        transaction = data.transaction.copy();
        transactions.addItem(transaction);
        transactions.setCurrent(transaction);

        data.nextCommandData.updateData = transaction;
    }
    else if (type === EventType.CHANGE)
    {
        this._setInputs(transaction,data,false);
        this._setToggles(transaction,data);
        this._setCategories(transaction,data,settings);
        this._setTime(transaction,data);
        this._setMethod(transaction,data,settings);
        this._setCurrency(transaction,data,settings);
    }
    else if (type === EventType.CONFIRM)
    {
        this._setInputs(transaction,data,true);
        this._setToggles(transaction,data);
        this._setMethod(transaction,data,settings);

        transaction.currencyBase = settings.baseCurrency;
        transaction.save();
        transactions.setCurrent(null);
    }
    else if (type === EventType.CANCEL)
    {
        if (transaction.isSaved())
        {
            transaction.revokeState();
            transactions.setCurrent(null);
        }
        else
        {
            transactions.removeItem(transaction).destroy();
        }
    }
    else if (type === EventType.DELETE)
    {
        transactions.removeItem(transaction).destroy();

        data.nextCommandData.updateData = transactions.copySource().reverse();
    }

    if (this._nextCommand) this._executeNextCommand(this._nextCommandData);
    else this.dispatchEvent(EventType.COMPLETE,this);
};

/**
 * Save input texts
 * @param {App.Transaction} transaction
 * @param {Object} data
 * @param {boolean} setDefault
 * @private
 */
App.ChangeTransaction.prototype._setInputs = function _setInputs(transaction,data,setDefault)
{
    transaction.amount = parseFloat(data.amount) || transaction.amount;
    transaction.note = data.note || transaction.note;

    if (setDefault && !transaction.amount) transaction.amount = "0";
};

/**
 * Save toggle button values
 * @param {App.Transaction} transaction
 * @param {Object} data
 * @private
 */
App.ChangeTransaction.prototype._setToggles = function _setToggles(transaction,data)
{
    transaction.type = data.transactionType || transaction.type;
    if (typeof data.pending === "boolean") transaction.pending = data.pending;
    if (typeof data.repeat === "boolean") transaction.repeat = data.repeat;
};

/**
 * Save Account, Category, and SubCategory
 * @param {App.Transaction} transaction
 * @param {Object} data
 * @param {App.Settings} settings
 * @private
 */
App.ChangeTransaction.prototype._setCategories = function _setCategories(transaction,data,settings)
{
    if (data.account && data.category && data.subCategory)
    {
        transaction.account = data.account;
        transaction.category = data.category;
        transaction.subCategory = data.subCategory;

        settings.defaultAccount = data.account;
        settings.defaultCategory = data.category;
        settings.defaultSubCategory = data.subCategory;
    }
};

/**
 * Save time and data
 * @param {App.Transaction} transaction
 * @param {Object} data
 * @private
 */
App.ChangeTransaction.prototype._setTime = function _setTime(transaction,data)
{
    var date = data.date,
        time = data.time;

    if (date && time)
    {
        transaction.date.setFullYear(date.getFullYear(),date.getMonth(),date.getDate());
        if (time.length > 0) transaction.date.setHours(parseInt(time.split(":")[0],10),parseInt(time.split(":")[1],10));
    }
};

/**
 * Save payment method
 * @param {App.Transaction} transaction
 * @param {Object} data
 * @param {App.Settings} settings
 * @private
 */
App.ChangeTransaction.prototype._setMethod = function _setMethod(transaction,data,settings)
{
    if (data.method)
    {
        var method = App.ModelLocator.getProxy(App.ModelName.PAYMENT_METHODS).find("name",data.method);
        transaction.method = method;
        settings.defaultPaymentMethod = method;
    }
};

/**
 * Save currency quote
 * @param {App.Transaction} transaction
 * @param {Object} data
 * @param {App.Settings} settings
 * @private
 */
App.ChangeTransaction.prototype._setCurrency = function _setCurrency(transaction,data,settings)
{
    if (data.currencyQuote)
    {
        transaction.currencyQuote = data.currencyQuote;
        settings.defaultCurrencyQuote = data.currencyQuote;
    }
};
