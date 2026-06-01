"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem = void 0;
var NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem = (function () {
    function NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem() {
        this['allowDuplicates'] = false;
    }
    NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem.discriminator = undefined;
    NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem.attributeTypeMap = [
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
    return NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem;
}());
exports.NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem = NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem;
//# sourceMappingURL=newConfirmedInternalTransactionsAndEachConfirmationRBDataItem.js.map