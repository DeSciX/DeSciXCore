"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewChangeAddressesUTXO401Response = void 0;
var DeriveAndSyncNewChangeAddressesUTXO401Response = (function () {
    function DeriveAndSyncNewChangeAddressesUTXO401Response() {
    }
    DeriveAndSyncNewChangeAddressesUTXO401Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewChangeAddressesUTXO401Response.attributeTypeMap;
    };
    DeriveAndSyncNewChangeAddressesUTXO401Response.discriminator = undefined;
    DeriveAndSyncNewChangeAddressesUTXO401Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewChangeAddressesUTXOE401"
        }
    ];
    return DeriveAndSyncNewChangeAddressesUTXO401Response;
}());
exports.DeriveAndSyncNewChangeAddressesUTXO401Response = DeriveAndSyncNewChangeAddressesUTXO401Response;
//# sourceMappingURL=deriveAndSyncNewChangeAddressesUTXO401Response.js.map