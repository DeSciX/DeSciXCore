"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsRData = void 0;
var ListConfirmedTransactionsByAddressUTXOsRData = (function () {
    function ListConfirmedTransactionsByAddressUTXOsRData() {
    }
    ListConfirmedTransactionsByAddressUTXOsRData.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsRData.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsRData.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsRData.attributeTypeMap = [
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
            "type": "Array<ListConfirmedTransactionsByAddressUTXOsRI>"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOsRData;
}());
exports.ListConfirmedTransactionsByAddressUTXOsRData = ListConfirmedTransactionsByAddressUTXOsRData;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsRData.js.map