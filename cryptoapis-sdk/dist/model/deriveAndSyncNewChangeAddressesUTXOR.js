"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewChangeAddressesUTXOR = void 0;
var DeriveAndSyncNewChangeAddressesUTXOR = (function () {
    function DeriveAndSyncNewChangeAddressesUTXOR() {
    }
    DeriveAndSyncNewChangeAddressesUTXOR.getAttributeTypeMap = function () {
        return DeriveAndSyncNewChangeAddressesUTXOR.attributeTypeMap;
    };
    DeriveAndSyncNewChangeAddressesUTXOR.discriminator = undefined;
    DeriveAndSyncNewChangeAddressesUTXOR.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewChangeAddressesUTXORData"
        }
    ];
    return DeriveAndSyncNewChangeAddressesUTXOR;
}());
exports.DeriveAndSyncNewChangeAddressesUTXOR = DeriveAndSyncNewChangeAddressesUTXOR;
//# sourceMappingURL=deriveAndSyncNewChangeAddressesUTXOR.js.map