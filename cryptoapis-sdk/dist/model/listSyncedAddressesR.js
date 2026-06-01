"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesR = void 0;
var ListSyncedAddressesR = (function () {
    function ListSyncedAddressesR() {
    }
    ListSyncedAddressesR.getAttributeTypeMap = function () {
        return ListSyncedAddressesR.attributeTypeMap;
    };
    ListSyncedAddressesR.discriminator = undefined;
    ListSyncedAddressesR.attributeTypeMap = [
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
            "type": "ListSyncedAddressesRData"
        }
    ];
    return ListSyncedAddressesR;
}());
exports.ListSyncedAddressesR = ListSyncedAddressesR;
//# sourceMappingURL=listSyncedAddressesR.js.map