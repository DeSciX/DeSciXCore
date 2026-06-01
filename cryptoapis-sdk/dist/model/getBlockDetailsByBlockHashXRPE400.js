"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashXRPE400 = void 0;
var GetBlockDetailsByBlockHashXRPE400 = (function () {
    function GetBlockDetailsByBlockHashXRPE400() {
    }
    GetBlockDetailsByBlockHashXRPE400.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashXRPE400.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashXRPE400.discriminator = undefined;
    GetBlockDetailsByBlockHashXRPE400.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHashXRPE400;
}());
exports.GetBlockDetailsByBlockHashXRPE400 = GetBlockDetailsByBlockHashXRPE400;
//# sourceMappingURL=getBlockDetailsByBlockHashXRPE400.js.map