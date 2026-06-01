"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesXRPRI = void 0;
var ListSyncedAddressesXRPRI = (function () {
    function ListSyncedAddressesXRPRI() {
    }
    ListSyncedAddressesXRPRI.getAttributeTypeMap = function () {
        return ListSyncedAddressesXRPRI.attributeTypeMap;
    };
    ListSyncedAddressesXRPRI.discriminator = undefined;
    ListSyncedAddressesXRPRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "index",
            "baseName": "index",
            "type": "number"
        }
    ];
    return ListSyncedAddressesXRPRI;
}());
exports.ListSyncedAddressesXRPRI = ListSyncedAddressesXRPRI;
//# sourceMappingURL=listSyncedAddressesXRPRI.js.map