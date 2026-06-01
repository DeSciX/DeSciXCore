"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaRData = void 0;
var ListTransactionsByAddressSolanaRData = (function () {
    function ListTransactionsByAddressSolanaRData() {
    }
    ListTransactionsByAddressSolanaRData.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaRData.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaRData.discriminator = undefined;
    ListTransactionsByAddressSolanaRData.attributeTypeMap = [
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
            "type": "Array<ListTransactionsByAddressSolanaRI>"
        }
    ];
    return ListTransactionsByAddressSolanaRData;
}());
exports.ListTransactionsByAddressSolanaRData = ListTransactionsByAddressSolanaRData;
//# sourceMappingURL=listTransactionsByAddressSolanaRData.js.map