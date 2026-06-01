"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewChangeAddressesUTXO400Response = void 0;
var DeriveAndSyncNewChangeAddressesUTXO400Response = (function () {
    function DeriveAndSyncNewChangeAddressesUTXO400Response() {
    }
    DeriveAndSyncNewChangeAddressesUTXO400Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewChangeAddressesUTXO400Response.attributeTypeMap;
    };
    DeriveAndSyncNewChangeAddressesUTXO400Response.discriminator = undefined;
    DeriveAndSyncNewChangeAddressesUTXO400Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewChangeAddressesUTXOE400"
        }
    ];
    return DeriveAndSyncNewChangeAddressesUTXO400Response;
}());
exports.DeriveAndSyncNewChangeAddressesUTXO400Response = DeriveAndSyncNewChangeAddressesUTXO400Response;
//# sourceMappingURL=deriveAndSyncNewChangeAddressesUTXO400Response.js.map