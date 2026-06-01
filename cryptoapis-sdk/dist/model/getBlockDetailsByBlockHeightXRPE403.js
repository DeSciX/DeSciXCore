"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightXRPE403 = void 0;
var GetBlockDetailsByBlockHeightXRPE403 = (function () {
    function GetBlockDetailsByBlockHeightXRPE403() {
    }
    GetBlockDetailsByBlockHeightXRPE403.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightXRPE403.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightXRPE403.discriminator = undefined;
    GetBlockDetailsByBlockHeightXRPE403.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHeightXRPE403;
}());
exports.GetBlockDetailsByBlockHeightXRPE403 = GetBlockDetailsByBlockHeightXRPE403;
//# sourceMappingURL=getBlockDetailsByBlockHeightXRPE403.js.map