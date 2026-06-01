"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextAvailableSequenceXRPR = void 0;
var NextAvailableSequenceXRPR = (function () {
    function NextAvailableSequenceXRPR() {
    }
    NextAvailableSequenceXRPR.getAttributeTypeMap = function () {
        return NextAvailableSequenceXRPR.attributeTypeMap;
    };
    NextAvailableSequenceXRPR.discriminator = undefined;
    NextAvailableSequenceXRPR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "NextAvailableSequenceXRPRData"
        }
    ];
    return NextAvailableSequenceXRPR;
}());
exports.NextAvailableSequenceXRPR = NextAvailableSequenceXRPR;
//# sourceMappingURL=nextAvailableSequenceXRPR.js.map