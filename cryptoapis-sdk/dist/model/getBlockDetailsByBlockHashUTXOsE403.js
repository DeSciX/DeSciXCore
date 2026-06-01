"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashUTXOsE403 = void 0;
var GetBlockDetailsByBlockHashUTXOsE403 = (function () {
    function GetBlockDetailsByBlockHashUTXOsE403() {
    }
    GetBlockDetailsByBlockHashUTXOsE403.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashUTXOsE403.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashUTXOsE403.discriminator = undefined;
    GetBlockDetailsByBlockHashUTXOsE403.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHashUTXOsE403;
}());
exports.GetBlockDetailsByBlockHashUTXOsE403 = GetBlockDetailsByBlockHashUTXOsE403;
//# sourceMappingURL=getBlockDetailsByBlockHashUTXOsE403.js.map