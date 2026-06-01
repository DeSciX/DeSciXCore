"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewChangeAddressesUTXO403Response = void 0;
var DeriveAndSyncNewChangeAddressesUTXO403Response = (function () {
    function DeriveAndSyncNewChangeAddressesUTXO403Response() {
    }
    DeriveAndSyncNewChangeAddressesUTXO403Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewChangeAddressesUTXO403Response.attributeTypeMap;
    };
    DeriveAndSyncNewChangeAddressesUTXO403Response.discriminator = undefined;
    DeriveAndSyncNewChangeAddressesUTXO403Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewChangeAddressesUTXOE403"
        }
    ];
    return DeriveAndSyncNewChangeAddressesUTXO403Response;
}());
exports.DeriveAndSyncNewChangeAddressesUTXO403Response = DeriveAndSyncNewChangeAddressesUTXO403Response;
//# sourceMappingURL=deriveAndSyncNewChangeAddressesUTXO403Response.js.map