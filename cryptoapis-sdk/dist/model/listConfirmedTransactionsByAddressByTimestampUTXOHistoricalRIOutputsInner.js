"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerValue"
        }
    ];
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner = ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner.js.map