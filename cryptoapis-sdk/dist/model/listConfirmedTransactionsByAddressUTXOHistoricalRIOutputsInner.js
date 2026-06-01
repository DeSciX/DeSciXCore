"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner = void 0;
var ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner() {
    }
    ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner.attributeTypeMap = [
        {
            "name": "addresses",
            "baseName": "addresses",
            "type": "Array<string>"
        },
        {
            "name": "isSpent",
            "baseName": "isSpent",
            "type": "boolean"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInnerValue"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner = ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner.js.map