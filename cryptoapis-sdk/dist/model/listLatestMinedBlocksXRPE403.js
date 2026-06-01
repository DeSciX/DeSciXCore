"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksXRPE403 = void 0;
var ListLatestMinedBlocksXRPE403 = (function () {
    function ListLatestMinedBlocksXRPE403() {
    }
    ListLatestMinedBlocksXRPE403.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksXRPE403.attributeTypeMap;
    };
    ListLatestMinedBlocksXRPE403.discriminator = undefined;
    ListLatestMinedBlocksXRPE403.attributeTypeMap = [
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
    return ListLatestMinedBlocksXRPE403;
}());
exports.ListLatestMinedBlocksXRPE403 = ListLatestMinedBlocksXRPE403;
//# sourceMappingURL=listLatestMinedBlocksXRPE403.js.map