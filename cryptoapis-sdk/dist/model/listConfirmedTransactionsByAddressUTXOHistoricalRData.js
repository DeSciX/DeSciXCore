"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistoricalRData = void 0;
var ListConfirmedTransactionsByAddressUTXOHistoricalRData = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistoricalRData() {
    }
    ListConfirmedTransactionsByAddressUTXOHistoricalRData.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistoricalRData.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistoricalRData.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistoricalRData.attributeTypeMap = [
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
            "type": "Array<ListConfirmedTransactionsByAddressUTXOHistoricalRI>"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOHistoricalRData;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistoricalRData = ListConfirmedTransactionsByAddressUTXOHistoricalRData;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistoricalRData.js.map