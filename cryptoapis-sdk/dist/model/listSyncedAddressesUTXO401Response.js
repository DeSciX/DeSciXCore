"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesUTXO401Response = void 0;
var ListSyncedAddressesUTXO401Response = (function () {
    function ListSyncedAddressesUTXO401Response() {
    }
    ListSyncedAddressesUTXO401Response.getAttributeTypeMap = function () {
        return ListSyncedAddressesUTXO401Response.attributeTypeMap;
    };
    ListSyncedAddressesUTXO401Response.discriminator = undefined;
    ListSyncedAddressesUTXO401Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressesUTXOE401"
        }
    ];
    return ListSyncedAddressesUTXO401Response;
}());
exports.ListSyncedAddressesUTXO401Response = ListSyncedAddressesUTXO401Response;
//# sourceMappingURL=listSyncedAddressesUTXO401Response.js.map