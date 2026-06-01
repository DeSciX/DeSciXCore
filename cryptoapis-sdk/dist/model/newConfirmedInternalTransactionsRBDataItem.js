"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsRBDataItem = void 0;
var NewConfirmedInternalTransactionsRBDataItem = (function () {
    function NewConfirmedInternalTransactionsRBDataItem() {
        this['allowDuplicates'] = false;
    }
    NewConfirmedInternalTransactionsRBDataItem.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsRBDataItem.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsRBDataItem.discriminator = undefined;
    NewConfirmedInternalTransactionsRBDataItem.attributeTypeMap = [
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
    return NewConfirmedInternalTransactionsRBDataItem;
}());
exports.NewConfirmedInternalTransactionsRBDataItem = NewConfirmedInternalTransactionsRBDataItem;
//# sourceMappingURL=newConfirmedInternalTransactionsRBDataItem.js.map