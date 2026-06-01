"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "startingAfter",
            "baseName": "startingAfter",
            "type": "string"
        },
        {
            "name": "hasMore",
            "baseName": "hasMore",
            "type": "boolean"
        },
        {
            "name": "nextStartingAfter",
            "baseName": "nextStartingAfter",
            "type": "string"
        },
        {
            "name": "sortingOrder",
            "baseName": "sortingOrder",
            "type": "string"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI>"
        }
    ];
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData = ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData.js.map