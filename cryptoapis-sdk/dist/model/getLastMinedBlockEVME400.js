"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockEVME400 = void 0;
var GetLastMinedBlockEVME400 = (function () {
    function GetLastMinedBlockEVME400() {
    }
    GetLastMinedBlockEVME400.getAttributeTypeMap = function () {
        return GetLastMinedBlockEVME400.attributeTypeMap;
    };
    GetLastMinedBlockEVME400.discriminator = undefined;
    GetLastMinedBlockEVME400.attributeTypeMap = [
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
    return GetLastMinedBlockEVME400;
}());
exports.GetLastMinedBlockEVME400 = GetLastMinedBlockEVME400;
//# sourceMappingURL=getLastMinedBlockEVME400.js.map