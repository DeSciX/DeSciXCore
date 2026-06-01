"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashXRPE401 = void 0;
var GetBlockDetailsByBlockHashXRPE401 = (function () {
    function GetBlockDetailsByBlockHashXRPE401() {
    }
    GetBlockDetailsByBlockHashXRPE401.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashXRPE401.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashXRPE401.discriminator = undefined;
    GetBlockDetailsByBlockHashXRPE401.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHashXRPE401;
}());
exports.GetBlockDetailsByBlockHashXRPE401 = GetBlockDetailsByBlockHashXRPE401;
//# sourceMappingURL=getBlockDetailsByBlockHashXRPE401.js.map