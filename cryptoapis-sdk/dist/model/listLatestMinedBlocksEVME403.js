"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksEVME403 = void 0;
var ListLatestMinedBlocksEVME403 = (function () {
    function ListLatestMinedBlocksEVME403() {
    }
    ListLatestMinedBlocksEVME403.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksEVME403.attributeTypeMap;
    };
    ListLatestMinedBlocksEVME403.discriminator = undefined;
    ListLatestMinedBlocksEVME403.attributeTypeMap = [
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
    return ListLatestMinedBlocksEVME403;
}());
exports.ListLatestMinedBlocksEVME403 = ListLatestMinedBlocksEVME403;
//# sourceMappingURL=listLatestMinedBlocksEVME403.js.map