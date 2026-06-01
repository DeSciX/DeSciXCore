"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesUTXO403Response = void 0;
var ListSyncedAddressesUTXO403Response = (function () {
    function ListSyncedAddressesUTXO403Response() {
    }
    ListSyncedAddressesUTXO403Response.getAttributeTypeMap = function () {
        return ListSyncedAddressesUTXO403Response.attributeTypeMap;
    };
    ListSyncedAddressesUTXO403Response.discriminator = undefined;
    ListSyncedAddressesUTXO403Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressesUTXOE403"
        }
    ];
    return ListSyncedAddressesUTXO403Response;
}());
exports.ListSyncedAddressesUTXO403Response = ListSyncedAddressesUTXO403Response;
//# sourceMappingURL=listSyncedAddressesUTXO403Response.js.map