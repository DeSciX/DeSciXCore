"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsRBDataItem = void 0;
var NewConfirmedCoinsTransactionsRBDataItem = (function () {
    function NewConfirmedCoinsTransactionsRBDataItem() {
        this['allowDuplicates'] = false;
    }
    NewConfirmedCoinsTransactionsRBDataItem.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsRBDataItem.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsRBDataItem.discriminator = undefined;
    NewConfirmedCoinsTransactionsRBDataItem.attributeTypeMap = [
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
        },
        {
            "name": "receiveCallbackOn",
            "baseName": "receiveCallbackOn",
            "type": "number"
        }
    ];
    return NewConfirmedCoinsTransactionsRBDataItem;
}());
exports.NewConfirmedCoinsTransactionsRBDataItem = NewConfirmedCoinsTransactionsRBDataItem;
//# sourceMappingURL=newConfirmedCoinsTransactionsRBDataItem.js.map