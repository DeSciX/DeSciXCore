"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockEVME403 = void 0;
var GetLastMinedBlockEVME403 = (function () {
    function GetLastMinedBlockEVME403() {
    }
    GetLastMinedBlockEVME403.getAttributeTypeMap = function () {
        return GetLastMinedBlockEVME403.attributeTypeMap;
    };
    GetLastMinedBlockEVME403.discriminator = undefined;
    GetLastMinedBlockEVME403.attributeTypeMap = [
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
    return GetLastMinedBlockEVME403;
}());
exports.GetLastMinedBlockEVME403 = GetLastMinedBlockEVME403;
//# sourceMappingURL=getLastMinedBlockEVME403.js.map