"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockUTXOsE400 = void 0;
var GetLastMinedBlockUTXOsE400 = (function () {
    function GetLastMinedBlockUTXOsE400() {
    }
    GetLastMinedBlockUTXOsE400.getAttributeTypeMap = function () {
        return GetLastMinedBlockUTXOsE400.attributeTypeMap;
    };
    GetLastMinedBlockUTXOsE400.discriminator = undefined;
    GetLastMinedBlockUTXOsE400.attributeTypeMap = [
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
    return GetLastMinedBlockUTXOsE400;
}());
exports.GetLastMinedBlockUTXOsE400 = GetLastMinedBlockUTXOsE400;
//# sourceMappingURL=getLastMinedBlockUTXOsE400.js.map