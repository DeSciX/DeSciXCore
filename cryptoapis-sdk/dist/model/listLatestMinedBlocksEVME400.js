"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksEVME400 = void 0;
var ListLatestMinedBlocksEVME400 = (function () {
    function ListLatestMinedBlocksEVME400() {
    }
    ListLatestMinedBlocksEVME400.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksEVME400.attributeTypeMap;
    };
    ListLatestMinedBlocksEVME400.discriminator = undefined;
    ListLatestMinedBlocksEVME400.attributeTypeMap = [
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
    return ListLatestMinedBlocksEVME400;
}());
exports.ListLatestMinedBlocksEVME400 = ListLatestMinedBlocksEVME400;
//# sourceMappingURL=listLatestMinedBlocksEVME400.js.map