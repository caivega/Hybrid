/**
 * @class Transaction
 * @param {Array} [data=null]
 * @param {Collection} [collection=null]
 * @param {*} [parent=null]
 * @param {ObjectPool} [eventListenerPool=null]
 * @constructor
 */
App.Transaction = function Transaction(data,collection,parent,eventListenerPool)
{
    if (data)
    {
        this._data = data;

        this.amount = data[0];
        this.type = data[1];
        this.pending = data[2] === 1;
        this.repeat = data[3] === 1;
        this._account = null;
        this._category = null;
        this._subCategory = null;
        this._method = null;
        this._date = null;
        this._currencySymbol = null;
        this.note = data[8] ? decodeURI(data[8]) : "";
    }
    else
    {
        this._data = null;

        this.amount = "";
        this.type = App.TransactionType.EXPENSE;
        this.pending = false;
        this.repeat = false;
        this._account = null;
        this._category = null;
        this._subCategory = null;
        this._method = null;
        this._date = null;
        this._currencySymbol = null;
        this.note = "";
    }
};

/**
 * Destroy
 */
App.Transaction.prototype.destroy = function destroy()
{
    this._account = null;
    this._category = null;
    this._subCategory = null;
    this._method = null;
    this._date = null;
};

/**
 * Check if the transaction is saved, i.e. has data
 * @returns {Array|null}
 */
App.Transaction.prototype.isSaved = function isSaved()
{
    return this._data;
};

/**
 * Save
 */
App.Transaction.prototype.save = function save()
{
    this._data = this.serialize();
};

/**
 * Serialize
 * @returns {Array}
 */
App.Transaction.prototype.serialize = function serialize()
{
    return [
        parseInt(this.amount,10),
        this.type,
        this.pending ? 1 : 0,
        this.repeat ? 1 : 0,
        this.account.id + "." + this.category.id + "." + this.subCategory.id,
        this.method.id,
        this.date.getTime(),
        this.currency,
        App.StringUtils.encode(this.note)//TODO check if note is set before even adding it
    ];
};

/**
 * Serialize currency in form 'base_currency.spent_currency.currencyPairID (USD.CZK.41)'
 * In case the base and symbol are same, currency pair ID will equal to 0
 * @returns {string}
 * @private
 */
/*App.Transaction.prototype._serializeCurrency = function _serializeCurrency()
{
    var baseSymbol = "CZK",//TODO this will be retrieved from Settings
        symbol = this.currency,
        serialized = baseSymbol+"."+symbol;

    if (symbol === baseSymbol)
    {
        serialized += ".0";
    }
    else
    {
        var currencyPairs = App.ModelLocator.getProxy(App.ModelName.CURRENCY_PAIRS),
            pair = null,
            i = 0,
            l = currencyPairs.length();

        for (;i<l;)
        {
            pair = currencyPairs.getItemAt(i++);
            if ((baseSymbol === pair.base && symbol === pair.symbol) || (baseSymbol === pair.symbol && symbol === pair.base))
            {
                serialized += "."+pair.id;
                break;
            }
        }
    }

    return serialized;
};*/

/**
 * Create and return copy of itself
 * @returns {App.Transaction}
 */
App.Transaction.prototype.copy = function copy()
{
    var copy = new App.Transaction();
    copy.amount = this.amount;
    copy.type = this.type;
    copy.pending = this.pending;
    copy.repeat = this.repeat;
    copy.account = this.account;
    copy.category = this.category;
    copy.subCategory = this.subCategory;
    copy.method = this.method;
    copy.date = this.date;
    copy.currency = this.currency;
    copy.note = this.note;

    return copy;
};

/**
 * @property account
 * @type Account
 */
Object.defineProperty(App.Transaction.prototype,'account',{
    get:function()
    {
        if (!this._account)
        {
            //TODO keep just IDs instead of reference?
            if (this._data) this._account = App.ModelLocator.getProxy(App.ModelName.ACCOUNTS).filter([this._data[4].split(".")[0]],"id")[0];
            else this._account = App.ModelLocator.getProxy(App.ModelName.SETTINGS).defaultAccount;
        }
        return this._account;//TODO save last used account as 'default' on save
    },
    set:function(value)
    {
        this._account = value;
    }
});

/**
 * @property category
 * @type Category
 */
Object.defineProperty(App.Transaction.prototype,'category',{
    get:function()
    {
        if (!this._category)
        {
            //TODO keep just IDs instead of reference?
            if (this._data)
            {
                var ModelLocator = App.ModelLocator,
                    ModelName = App.ModelName,
                    ids = this._data[4].split(".");

                this._category = ModelLocator.getProxy(ModelName.CATEGORIES).filter([ids[1]],"id")[0];
                this._subCategory = ModelLocator.getProxy(ModelName.SUB_CATEGORIES).filter([ids[2]],"id")[0];
            }
            else
            {
                this._category = App.ModelLocator.getProxy(App.ModelName.SETTINGS).defaultCategory;
                this._subCategory = App.ModelLocator.getProxy(App.ModelName.SETTINGS).defaultSubCategory;
            }
        }
        return this._category;//TODO save last used account as 'default' on save
    },
    set:function(value)
    {
        this._category = value;
    }
});

/**
 * @property subCategory
 * @type SubCategory
 */
Object.defineProperty(App.Transaction.prototype,'subCategory',{
    get:function()
    {
        //TODO keep just IDs instead of reference?
        if (!this._subCategory)
        {
            if (this._data) this._subCategory = App.ModelLocator.getProxy(App.ModelName.SUB_CATEGORIES).filter([this._data[4].split(".")[2]],"id")[0];
            else this._subCategory = App.ModelLocator.getProxy(App.ModelName.SETTINGS).defaultSubCategory;
        }
        return this._subCategory;
    },
    set:function(value)
    {
        this._subCategory = value;
    }
});

/**
 * @property method
 * @type PaymentMethod
 */
Object.defineProperty(App.Transaction.prototype,'method',{
    get:function()
    {
        //TODO keep just IDs instead of reference?
        if (!this._method)
        {
            if (this._data) this._method = App.ModelLocator.getProxy(App.ModelName.PAYMENT_METHODS).filter([this._data[5]],"id")[0];
            else this._method = App.ModelLocator.getProxy(App.ModelName.SETTINGS).defaultPaymentMethod;
        }
        return this._method;
    },
    set:function(value)
    {
        this._method = value;
    }
});

/**
 * @property date
 * @type Date
 */
Object.defineProperty(App.Transaction.prototype,'date',{
    get:function()
    {
        if (!this._date)
        {
            if (this._data) this._date = new Date(this._data[6]);
            else this._date = new Date();
        }
        return this._date;
    },
    set:function(value)
    {
        this._date = value;
    }
});

/**
 * @property currency
 * @type Currency
 */
Object.defineProperty(App.Transaction.prototype,'currency',{
    get:function()
    {
        if (!this._currencySymbol)
        {
            if (this._data) this._currencySymbol = App.ModelLocator.getProxy(App.ModelName.CURRENCY_SYMBOLS).filter([this._data[7]],"symbol")[0].symbol;
            else this._currencySymbol = App.ModelLocator.getProxy(App.ModelName.SETTINGS).baseCurrency.symbol;
        }
        return this._currencySymbol;
    },
    set:function(value)
    {
        this._currencySymbol = value;
    }
});
