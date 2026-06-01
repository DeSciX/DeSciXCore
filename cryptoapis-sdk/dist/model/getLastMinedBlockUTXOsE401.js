"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockUTXOsE401 = void 0;
var GetLastMinedBlockUTXOsE401 = (function () {
    function GetLastMinedBlockUTXOsE401() {
    }
    GetLastMinedBlockUTXOsE401.getAttributeTypeMap = function () {
        return GetLastMinedBlockUTXOsE401.attributeTypeMap;
    };
    GetLastMinedBlockUTXOsE401.discriminator = undefined;
    GetLastMinedBlockUTXOsE401.attributeTypeMap = [
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
    return GetLastMinedBlockUTXOsE401;
}());
exports.GetLastMinedBlockUTXOsE401 = GetLastMinedBlockUTXOsE401;
//# sourceMappingURL=getLastMinedBlockUTXOsE401.js.map