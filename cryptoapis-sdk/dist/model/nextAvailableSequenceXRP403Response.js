"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextAvailableSequenceXRP403Response = void 0;
var NextAvailableSequenceXRP403Response = (function () {
    function NextAvailableSequenceXRP403Response() {
    }
    NextAvailableSequenceXRP403Response.getAttributeTypeMap = function () {
        return NextAvailableSequenceXRP403Response.attributeTypeMap;
    };
    NextAvailableSequenceXRP403Response.discriminator = undefined;
    NextAvailableSequenceXRP403Response.attributeTypeMap = [
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
            "type": "NextAvailableSequenceXRPE403"
        }
    ];
    return NextAvailableSequenceXRP403Response;
}());
exports.NextAvailableSequenceXRP403Response = NextAvailableSequenceXRP403Response;
//# sourceMappingURL=nextAvailableSequenceXRP403Response.js.map