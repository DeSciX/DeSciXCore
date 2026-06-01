"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesRI = void 0;
var ListSyncedAddressesRI = (function () {
    function ListSyncedAddressesRI() {
    }
    ListSyncedAddressesRI.getAttributeTypeMap = function () {
        return ListSyncedAddressesRI.attributeTypeMap;
    };
    ListSyncedAddressesRI.discriminator = undefined;
    ListSyncedAddressesRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "blockchain",
            "baseName": "blockchain",
            "type": "string"
        },
        {
            "name": "id",
            "baseName": "id",
            "type": "string"
        },
        {
            "name": "isActive",
            "baseName": "isActive",
            "type": "boolean"
        },
        {
            "name": "network",
            "baseName": "network",
            "type": "string"
        },
        {
            "name": "syncStatus",
            "baseName": "syncStatus",
            "type": "string"
        }
    ];
    return ListSyncedAddressesRI;
}());
exports.ListSyncedAddressesRI = ListSyncedAddressesRI;
//# sourceMappingURL=listSyncedAddressesRI.js.map