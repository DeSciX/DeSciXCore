"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockEVME401 = void 0;
var GetLastMinedBlockEVME401 = (function () {
    function GetLastMinedBlockEVME401() {
    }
    GetLastMinedBlockEVME401.getAttributeTypeMap = function () {
        return GetLastMinedBlockEVME401.attributeTypeMap;
    };
    GetLastMinedBlockEVME401.discriminator = undefined;
    GetLastMinedBlockEVME401.attributeTypeMap = [
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
    return GetLastMinedBlockEVME401;
}());
exports.GetLastMinedBlockEVME401 = GetLastMinedBlockEVME401;
//# sourceMappingURL=getLastMinedBlockEVME401.js.map