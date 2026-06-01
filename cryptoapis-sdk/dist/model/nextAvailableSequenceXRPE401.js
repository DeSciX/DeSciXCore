"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextAvailableSequenceXRPE401 = void 0;
var NextAvailableSequenceXRPE401 = (function () {
    function NextAvailableSequenceXRPE401() {
    }
    NextAvailableSequenceXRPE401.getAttributeTypeMap = function () {
        return NextAvailableSequenceXRPE401.attributeTypeMap;
    };
    NextAvailableSequenceXRPE401.discriminator = undefined;
    NextAvailableSequenceXRPE401.attributeTypeMap = [
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
    return NextAvailableSequenceXRPE401;
}());
exports.NextAvailableSequenceXRPE401 = NextAvailableSequenceXRPE401;
//# sourceMappingURL=nextAvailableSequenceXRPE401.js.map