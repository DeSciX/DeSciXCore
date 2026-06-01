"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockUTXOsE403 = void 0;
var GetLastMinedBlockUTXOsE403 = (function () {
    function GetLastMinedBlockUTXOsE403() {
    }
    GetLastMinedBlockUTXOsE403.getAttributeTypeMap = function () {
        return GetLastMinedBlockUTXOsE403.attributeTypeMap;
    };
    GetLastMinedBlockUTXOsE403.discriminator = undefined;
    GetLastMinedBlockUTXOsE403.attributeTypeMap = [
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
    return GetLastMinedBlockUTXOsE403;
}());
exports.GetLastMinedBlockUTXOsE403 = GetLastMinedBlockUTXOsE403;
//# sourceMappingURL=getLastMinedBlockUTXOsE403.js.map