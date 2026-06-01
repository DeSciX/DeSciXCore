"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSolanaRData = void 0;
var ListTokensByAddressSolanaRData = (function () {
    function ListTokensByAddressSolanaRData() {
    }
    ListTokensByAddressSolanaRData.getAttributeTypeMap = function () {
        return ListTokensByAddressSolanaRData.attributeTypeMap;
    };
    ListTokensByAddressSolanaRData.discriminator = undefined;
    ListTokensByAddressSolanaRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListTokensByAddressSolanaRI>"
        }
    ];
    return ListTokensByAddressSolanaRData;
}());
exports.ListTokensByAddressSolanaRData = ListTokensByAddressSolanaRData;
//# sourceMappingURL=listTokensByAddressSolanaRData.js.map