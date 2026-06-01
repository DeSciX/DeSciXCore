"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSolanaR = void 0;
var ListTokensByAddressSolanaR = (function () {
    function ListTokensByAddressSolanaR() {
    }
    ListTokensByAddressSolanaR.getAttributeTypeMap = function () {
        return ListTokensByAddressSolanaR.attributeTypeMap;
    };
    ListTokensByAddressSolanaR.discriminator = undefined;
    ListTokensByAddressSolanaR.attributeTypeMap = [
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
            "type": "ListTokensByAddressSolanaRData"
        }
    ];
    return ListTokensByAddressSolanaR;
}());
exports.ListTokensByAddressSolanaR = ListTokensByAddressSolanaR;
//# sourceMappingURL=listTokensByAddressSolanaR.js.map