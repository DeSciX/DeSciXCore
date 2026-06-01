"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksEVME401 = void 0;
var ListLatestMinedBlocksEVME401 = (function () {
    function ListLatestMinedBlocksEVME401() {
    }
    ListLatestMinedBlocksEVME401.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksEVME401.attributeTypeMap;
    };
    ListLatestMinedBlocksEVME401.discriminator = undefined;
    ListLatestMinedBlocksEVME401.attributeTypeMap = [
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
    return ListLatestMinedBlocksEVME401;
}());
exports.ListLatestMinedBlocksEVME401 = ListLatestMinedBlocksEVME401;
//# sourceMappingURL=listLatestMinedBlocksEVME401.js.map