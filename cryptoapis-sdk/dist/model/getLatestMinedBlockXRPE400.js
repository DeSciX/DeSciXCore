"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLatestMinedBlockXRPE400 = void 0;
var GetLatestMinedBlockXRPE400 = (function () {
    function GetLatestMinedBlockXRPE400() {
    }
    GetLatestMinedBlockXRPE400.getAttributeTypeMap = function () {
        return GetLatestMinedBlockXRPE400.attributeTypeMap;
    };
    GetLatestMinedBlockXRPE400.discriminator = undefined;
    GetLatestMinedBlockXRPE400.attributeTypeMap = [
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
    return GetLatestMinedBlockXRPE400;
}());
exports.GetLatestMinedBlockXRPE400 = GetLatestMinedBlockXRPE400;
//# sourceMappingURL=getLatestMinedBlockXRPE400.js.map