"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksXRPE400 = void 0;
var ListLatestMinedBlocksXRPE400 = (function () {
    function ListLatestMinedBlocksXRPE400() {
    }
    ListLatestMinedBlocksXRPE400.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksXRPE400.attributeTypeMap;
    };
    ListLatestMinedBlocksXRPE400.discriminator = undefined;
    ListLatestMinedBlocksXRPE400.attributeTypeMap = [
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
    return ListLatestMinedBlocksXRPE400;
}());
exports.ListLatestMinedBlocksXRPE400 = ListLatestMinedBlocksXRPE400;
//# sourceMappingURL=listLatestMinedBlocksXRPE400.js.map