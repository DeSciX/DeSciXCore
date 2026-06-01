"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactionsRBDataItem = void 0;
var NewUnconfirmedCoinsTransactionsRBDataItem = (function () {
    function NewUnconfirmedCoinsTransactionsRBDataItem() {
        this['allowDuplicates'] = false;
    }
    NewUnconfirmedCoinsTransactionsRBDataItem.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactionsRBDataItem.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactionsRBDataItem.discriminator = undefined;
    NewUnconfirmedCoinsTransactionsRBDataItem.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "allowDuplicates",
            "baseName": "allowDuplicates",
            "type": "boolean"
        },
        {
            "name": "callbackSecretKey",
            "baseName": "callbackSecretKey",
            "type": "string"
        },
        {
            "name": "callbackUrl",
            "baseName": "callbackUrl",
            "type": "string"
        }
    ];
    return NewUnconfirmedCoinsTransactionsRBDataItem;
}());
exports.NewUnconfirmedCoinsTransactionsRBDataItem = NewUnconfirmedCoinsTransactionsRBDataItem;
//# sourceMappingURL=newUnconfirmedCoinsTransactionsRBDataItem.js.map