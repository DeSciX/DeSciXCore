"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksUTXOsE403 = void 0;
var ListLatestMinedBlocksUTXOsE403 = (function () {
    function ListLatestMinedBlocksUTXOsE403() {
    }
    ListLatestMinedBlocksUTXOsE403.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksUTXOsE403.attributeTypeMap;
    };
    ListLatestMinedBlocksUTXOsE403.discriminator = undefined;
    ListLatestMinedBlocksUTXOsE403.attributeTypeMap = [
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
    return ListLatestMinedBlocksUTXOsE403;
}());
exports.ListLatestMinedBlocksUTXOsE403 = ListLatestMinedBlocksUTXOsE403;
//# sourceMappingURL=listLatestMinedBlocksUTXOsE403.js.map