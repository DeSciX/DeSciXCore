"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightUTXOsE400 = void 0;
var GetBlockDetailsByBlockHeightUTXOsE400 = (function () {
    function GetBlockDetailsByBlockHeightUTXOsE400() {
    }
    GetBlockDetailsByBlockHeightUTXOsE400.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightUTXOsE400.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightUTXOsE400.discriminator = undefined;
    GetBlockDetailsByBlockHeightUTXOsE400.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHeightUTXOsE400;
}());
exports.GetBlockDetailsByBlockHeightUTXOsE400 = GetBlockDetailsByBlockHeightUTXOsE400;
//# sourceMappingURL=getBlockDetailsByBlockHeightUTXOsE400.js.map