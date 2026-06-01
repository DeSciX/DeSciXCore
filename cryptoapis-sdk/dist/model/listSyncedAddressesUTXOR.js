"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesUTXOR = void 0;
var ListSyncedAddressesUTXOR = (function () {
    function ListSyncedAddressesUTXOR() {
    }
    ListSyncedAddressesUTXOR.getAttributeTypeMap = function () {
        return ListSyncedAddressesUTXOR.attributeTypeMap;
    };
    ListSyncedAddressesUTXOR.discriminator = undefined;
    ListSyncedAddressesUTXOR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ListSyncedAddressesUTXORData"
        }
    ];
    return ListSyncedAddressesUTXOR;
}());
exports.ListSyncedAddressesUTXOR = ListSyncedAddressesUTXOR;
//# sourceMappingURL=listSyncedAddressesUTXOR.js.map