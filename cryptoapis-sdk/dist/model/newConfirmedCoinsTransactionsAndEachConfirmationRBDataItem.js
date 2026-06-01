"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem = void 0;
var NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem = (function () {
    function NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem() {
        this['allowDuplicates'] = false;
    }
    NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem.discriminator = undefined;
    NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem.attributeTypeMap = [
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
            "name": "confirmationsCount",
            "baseName": "confirmationsCount",
            "type": "number"
        }
    ];
    return NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem;
}());
exports.NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem = NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem;
//# sourceMappingURL=newConfirmedCoinsTransactionsAndEachConfirmationRBDataItem.js.map