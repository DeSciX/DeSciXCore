"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksXRPE401 = void 0;
var ListLatestMinedBlocksXRPE401 = (function () {
    function ListLatestMinedBlocksXRPE401() {
    }
    ListLatestMinedBlocksXRPE401.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksXRPE401.attributeTypeMap;
    };
    ListLatestMinedBlocksXRPE401.discriminator = undefined;
    ListLatestMinedBlocksXRPE401.attributeTypeMap = [
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
    return ListLatestMinedBlocksXRPE401;
}());
exports.ListLatestMinedBlocksXRPE401 = ListLatestMinedBlocksXRPE401;
//# sourceMappingURL=listLatestMinedBlocksXRPE401.js.map