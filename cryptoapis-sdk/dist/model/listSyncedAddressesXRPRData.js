"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesXRPRData = void 0;
var ListSyncedAddressesXRPRData = (function () {
    function ListSyncedAddressesXRPRData() {
    }
    ListSyncedAddressesXRPRData.getAttributeTypeMap = function () {
        return ListSyncedAddressesXRPRData.attributeTypeMap;
    };
    ListSyncedAddressesXRPRData.discriminator = undefined;
    ListSyncedAddressesXRPRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListSyncedAddressesXRPRI>"
        }
    ];
    return ListSyncedAddressesXRPRData;
}());
exports.ListSyncedAddressesXRPRData = ListSyncedAddressesXRPRData;
//# sourceMappingURL=listSyncedAddressesXRPRData.js.map