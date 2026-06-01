"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem = void 0;
var NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem = (function () {
    function NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem() {
        this['allowDuplicates'] = false;
    }
    NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem.discriminator = undefined;
    NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem.attributeTypeMap = [
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
    return NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem;
}());
exports.NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem = NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem;
//# sourceMappingURL=newConfirmedTokensTransactionsAndEachConfirmationRBDataItem.js.map