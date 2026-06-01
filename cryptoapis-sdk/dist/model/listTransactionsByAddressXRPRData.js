"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressXRPRData = void 0;
var ListTransactionsByAddressXRPRData = (function () {
    function ListTransactionsByAddressXRPRData() {
    }
    ListTransactionsByAddressXRPRData.getAttributeTypeMap = function () {
        return ListTransactionsByAddressXRPRData.attributeTypeMap;
    };
    ListTransactionsByAddressXRPRData.discriminator = undefined;
    ListTransactionsByAddressXRPRData.attributeTypeMap = [
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
            "type": "Array<ListTransactionsByAddressXRPRI>"
        }
    ];
    return ListTransactionsByAddressXRPRData;
}());
exports.ListTransactionsByAddressXRPRData = ListTransactionsByAddressXRPRData;
//# sourceMappingURL=listTransactionsByAddressXRPRData.js.map