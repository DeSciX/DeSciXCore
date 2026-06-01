"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextAvailableSequenceXRP400Response = void 0;
var NextAvailableSequenceXRP400Response = (function () {
    function NextAvailableSequenceXRP400Response() {
    }
    NextAvailableSequenceXRP400Response.getAttributeTypeMap = function () {
        return NextAvailableSequenceXRP400Response.attributeTypeMap;
    };
    NextAvailableSequenceXRP400Response.discriminator = undefined;
    NextAvailableSequenceXRP400Response.attributeTypeMap = [
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
            "type": "NextAvailableSequenceXRPE400"
        }
    ];
    return NextAvailableSequenceXRP400Response;
}());
exports.NextAvailableSequenceXRP400Response = NextAvailableSequenceXRP400Response;
//# sourceMappingURL=nextAvailableSequenceXRP400Response.js.map