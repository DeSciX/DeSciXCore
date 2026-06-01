"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspaRData = void 0;
var ListConfirmedTransactionsByAddressKaspaRData = (function () {
    function ListConfirmedTransactionsByAddressKaspaRData() {
    }
    ListConfirmedTransactionsByAddressKaspaRData.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspaRData.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspaRData.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspaRData.attributeTypeMap = [
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
            "type": "Array<ListConfirmedTransactionsByAddressKaspaRI>"
        }
    ];
    return ListConfirmedTransactionsByAddressKaspaRData;
}());
exports.ListConfirmedTransactionsByAddressKaspaRData = ListConfirmedTransactionsByAddressKaspaRData;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspaRData.js.map