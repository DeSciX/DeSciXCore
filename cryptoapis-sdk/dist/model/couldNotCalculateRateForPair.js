"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouldNotCalculateRateForPair = void 0;
var CouldNotCalculateRateForPair = (function () {
    function CouldNotCalculateRateForPair() {
    }
    CouldNotCalculateRateForPair.getAttributeTypeMap = function () {
        return CouldNotCalculateRateForPair.attributeTypeMap;
    };
    CouldNotCalculateRateForPair.discriminator = undefined;
    CouldNotCalculateRateForPair.attributeTypeMap = [
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
    return CouldNotCalculateRateForPair;
}());
exports.CouldNotCalculateRateForPair = CouldNotCalculateRateForPair;
//# sourceMappingURL=couldNotCalculateRateForPair.js.map