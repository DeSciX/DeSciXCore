"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesUTXO400Response = void 0;
var ListSyncedAddressesUTXO400Response = (function () {
    function ListSyncedAddressesUTXO400Response() {
    }
    ListSyncedAddressesUTXO400Response.getAttributeTypeMap = function () {
        return ListSyncedAddressesUTXO400Response.attributeTypeMap;
    };
    ListSyncedAddressesUTXO400Response.discriminator = undefined;
    ListSyncedAddressesUTXO400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "ListSyncedAddressesUTXOE400"
        }
    ];
    return ListSyncedAddressesUTXO400Response;
}());
exports.ListSyncedAddressesUTXO400Response = ListSyncedAddressesUTXO400Response;
//# sourceMappingURL=listSyncedAddressesUTXO400Response.js.map