"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsRBDataItem = void 0;
var NewConfirmedTokensTransactionsRBDataItem = (function () {
    function NewConfirmedTokensTransactionsRBDataItem() {
        this['allowDuplicates'] = false;
    }
    NewConfirmedTokensTransactionsRBDataItem.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsRBDataItem.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsRBDataItem.discriminator = undefined;
    NewConfirmedTokensTransactionsRBDataItem.attributeTypeMap = [
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
    return NewConfirmedTokensTransactionsRBDataItem;
}());
exports.NewConfirmedTokensTransactionsRBDataItem = NewConfirmedTokensTransactionsRBDataItem;
//# sourceMappingURL=newConfirmedTokensTransactionsRBDataItem.js.map