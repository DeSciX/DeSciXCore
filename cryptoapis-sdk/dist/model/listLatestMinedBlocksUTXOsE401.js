"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksUTXOsE401 = void 0;
var ListLatestMinedBlocksUTXOsE401 = (function () {
    function ListLatestMinedBlocksUTXOsE401() {
    }
    ListLatestMinedBlocksUTXOsE401.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksUTXOsE401.attributeTypeMap;
    };
    ListLatestMinedBlocksUTXOsE401.discriminator = undefined;
    ListLatestMinedBlocksUTXOsE401.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return ListLatestMinedBlocksUTXOsE401;
}());
exports.ListLatestMinedBlocksUTXOsE401 = ListLatestMinedBlocksUTXOsE401;
//# sourceMappingURL=listLatestMinedBlocksUTXOsE401.js.map