"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksUTXOsE400 = void 0;
var ListLatestMinedBlocksUTXOsE400 = (function () {
    function ListLatestMinedBlocksUTXOsE400() {
    }
    ListLatestMinedBlocksUTXOsE400.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksUTXOsE400.attributeTypeMap;
    };
    ListLatestMinedBlocksUTXOsE400.discriminator = undefined;
    ListLatestMinedBlocksUTXOsE400.attributeTypeMap = [
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
    return ListLatestMinedBlocksUTXOsE400;
}());
exports.ListLatestMinedBlocksUTXOsE400 = ListLatestMinedBlocksUTXOsE400;
//# sourceMappingURL=listLatestMinedBlocksUTXOsE400.js.map