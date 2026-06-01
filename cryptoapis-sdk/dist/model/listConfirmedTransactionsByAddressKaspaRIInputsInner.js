"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspaRIInputsInner = void 0;
var ListConfirmedTransactionsByAddressKaspaRIInputsInner = (function () {
    function ListConfirmedTransactionsByAddressKaspaRIInputsInner() {
    }
    ListConfirmedTransactionsByAddressKaspaRIInputsInner.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspaRIInputsInner.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspaRIInputsInner.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspaRIInputsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "outputIndex",
            "baseName": "outputIndex",
            "type": "number"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "GetTransactionDetailsByTransactionIdKaspaRIInputsInnerValue"
        }
    ];
    return ListConfirmedTransactionsByAddressKaspaRIInputsInner;
}());
exports.ListConfirmedTransactionsByAddressKaspaRIInputsInner = ListConfirmedTransactionsByAddressKaspaRIInputsInner;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspaRIInputsInner.js.map