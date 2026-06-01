"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightXRPE401 = void 0;
var GetBlockDetailsByBlockHeightXRPE401 = (function () {
    function GetBlockDetailsByBlockHeightXRPE401() {
    }
    GetBlockDetailsByBlockHeightXRPE401.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightXRPE401.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightXRPE401.discriminator = undefined;
    GetBlockDetailsByBlockHeightXRPE401.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHeightXRPE401;
}());
exports.GetBlockDetailsByBlockHeightXRPE401 = GetBlockDetailsByBlockHeightXRPE401;
//# sourceMappingURL=getBlockDetailsByBlockHeightXRPE401.js.map