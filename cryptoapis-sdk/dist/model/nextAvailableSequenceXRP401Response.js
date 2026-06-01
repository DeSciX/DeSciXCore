"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextAvailableSequenceXRP401Response = void 0;
var NextAvailableSequenceXRP401Response = (function () {
    function NextAvailableSequenceXRP401Response() {
    }
    NextAvailableSequenceXRP401Response.getAttributeTypeMap = function () {
        return NextAvailableSequenceXRP401Response.attributeTypeMap;
    };
    NextAvailableSequenceXRP401Response.discriminator = undefined;
    NextAvailableSequenceXRP401Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "NextAvailableSequenceXRPE401"
        }
    ];
    return NextAvailableSequenceXRP401Response;
}());
exports.NextAvailableSequenceXRP401Response = NextAvailableSequenceXRP401Response;
//# sourceMappingURL=nextAvailableSequenceXRP401Response.js.map