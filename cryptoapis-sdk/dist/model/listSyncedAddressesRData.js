"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesRData = void 0;
var ListSyncedAddressesRData = (function () {
    function ListSyncedAddressesRData() {
    }
    ListSyncedAddressesRData.getAttributeTypeMap = function () {
        return ListSyncedAddressesRData.attributeTypeMap;
    };
    ListSyncedAddressesRData.discriminator = undefined;
    ListSyncedAddressesRData.attributeTypeMap = [
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
            "type": "Array<ListSyncedAddressesRI>"
        }
    ];
    return ListSyncedAddressesRData;
}());
exports.ListSyncedAddressesRData = ListSyncedAddressesRData;
//# sourceMappingURL=listSyncedAddressesRData.js.map