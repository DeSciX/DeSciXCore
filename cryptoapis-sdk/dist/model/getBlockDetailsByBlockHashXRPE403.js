"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashXRPE403 = void 0;
var GetBlockDetailsByBlockHashXRPE403 = (function () {
    function GetBlockDetailsByBlockHashXRPE403() {
    }
    GetBlockDetailsByBlockHashXRPE403.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashXRPE403.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashXRPE403.discriminator = undefined;
    GetBlockDetailsByBlockHashXRPE403.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHashXRPE403;
}());
exports.GetBlockDetailsByBlockHashXRPE403 = GetBlockDetailsByBlockHashXRPE403;
//# sourceMappingURL=getBlockDetailsByBlockHashXRPE403.js.map