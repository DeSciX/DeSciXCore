"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesUTXORI = void 0;
var ListSyncedAddressesUTXORI = (function () {
    function ListSyncedAddressesUTXORI() {
    }
    ListSyncedAddressesUTXORI.getAttributeTypeMap = function () {
        return ListSyncedAddressesUTXORI.attributeTypeMap;
    };
    ListSyncedAddressesUTXORI.discriminator = undefined;
    ListSyncedAddressesUTXORI.attributeTypeMap = [
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
    return ListSyncedAddressesUTXORI;
}());
exports.ListSyncedAddressesUTXORI = ListSyncedAddressesUTXORI;
//# sourceMappingURL=listSyncedAddressesUTXORI.js.map