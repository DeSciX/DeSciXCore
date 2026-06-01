"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLatestMinedBlockXRPE401 = void 0;
var GetLatestMinedBlockXRPE401 = (function () {
    function GetLatestMinedBlockXRPE401() {
    }
    GetLatestMinedBlockXRPE401.getAttributeTypeMap = function () {
        return GetLatestMinedBlockXRPE401.attributeTypeMap;
    };
    GetLatestMinedBlockXRPE401.discriminator = undefined;
    GetLatestMinedBlockXRPE401.attributeTypeMap = [
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
    return GetLatestMinedBlockXRPE401;
}());
exports.GetLatestMinedBlockXRPE401 = GetLatestMinedBlockXRPE401;
//# sourceMappingURL=getLatestMinedBlockXRPE401.js.map