"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightXRPE400 = void 0;
var GetBlockDetailsByBlockHeightXRPE400 = (function () {
    function GetBlockDetailsByBlockHeightXRPE400() {
    }
    GetBlockDetailsByBlockHeightXRPE400.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightXRPE400.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightXRPE400.discriminator = undefined;
    GetBlockDetailsByBlockHeightXRPE400.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHeightXRPE400;
}());
exports.GetBlockDetailsByBlockHeightXRPE400 = GetBlockDetailsByBlockHeightXRPE400;
//# sourceMappingURL=getBlockDetailsByBlockHeightXRPE400.js.map