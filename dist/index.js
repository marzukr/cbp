"use strict";
/**
 * This file serves as our Customs and Border Control between arbitrary objects
 * and our typed interfaces. The 'agents' in this file will look at an object
 * and 'stamp' it if it is a valid typescript object of the type they are
 * trained to inspect.
 *
 * Agents can route objects to other agents. For example, the ArrayAgent will
 * first check that the object is a valid array, then it will route the items of
 * the array to whichever Agent(s) are handling the type of the items of the
 * array.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsnakeAgent = exports.enumAgent = exports.arrayAgent = exports.nullAgent = exports.booleanAgent = exports.numberAgent = exports.stringAgent = void 0;
exports.hasProperty = hasProperty;
exports.unionAgent = unionAgent;
exports.nullableAgent = nullableAgent;
exports.objectAgent = objectAgent;
exports.conversionAgent = conversionAgent;
const lodash_1 = require("lodash");
/** */
/** Base and Utility Function and Types ***************************************/
/** */
class BaseAgent {
    /**
     * A function that checks if the given value can be made into a T with
     * makeStampable.
     */
    canStamp(requested) {
        const stampable = this.makeStampable(requested);
        return this.verifyStamp(stampable);
    }
    ;
    /**
     * If we need to make any modifications to requested before we can stamp it,
     * we do that here.
     */
    makeStampable(requested) {
        return requested;
    }
    /**
     * A function that takes some value we want to convert to `T`, verifies if the
     * conversion is valid, and returns the converted value if so. Otherwise, we
     * throw.
     */
    stamp(requested) {
        const stampable = this.makeStampable(requested);
        if (this.verifyStamp(stampable))
            return stampable;
        throw new Error(`${requested} cannot be stamped by agent ${this}`);
    }
}
function hasProperty(data, property) {
    return property in data;
}
;
/** */
/** Primitives ****************************************************************/
/** */
class StringAgent extends BaseAgent {
    verifyStamp(requested) {
        return typeof requested === 'string';
    }
}
exports.stringAgent = new StringAgent();
class NumberAgent extends BaseAgent {
    verifyStamp(requested) {
        return typeof requested === 'number';
    }
}
exports.numberAgent = new NumberAgent();
class BooleanAgent extends BaseAgent {
    verifyStamp(requested) {
        return typeof requested === 'boolean';
    }
}
exports.booleanAgent = new BooleanAgent();
class NullAgent extends BaseAgent {
    verifyStamp(requested) {
        return requested === null;
    }
}
exports.nullAgent = new NullAgent();
/** */
/** Union Agent ***************************************************************/
/** */
class UnionAgent extends BaseAgent {
    constructor(uAgent, vAgent) {
        super();
        this.directReports = {
            u: uAgent,
            v: vAgent,
        };
    }
    makeStampable(requested) {
        if (this.directReports.u.canStamp(requested)) {
            return this.directReports.u.makeStampable(requested);
        }
        else if (this.directReports.v.canStamp(requested)) {
            return this.directReports.v.makeStampable(requested);
        }
        return requested;
    }
    verifyStamp(requested) {
        return (this.directReports.u.verifyStamp(requested)
            || this.directReports.v.verifyStamp(requested));
    }
}
function unionAgent(leftType, rightType) {
    return new UnionAgent(leftType, rightType);
}
function nullableAgent(otherAgent) {
    return unionAgent(exports.nullAgent, otherAgent);
}
/** */
/** Array Agent ***************************************************************/
/** */
class ArrayAgent extends BaseAgent {
    constructor(itemAgent) {
        super();
        this.itemAgent = itemAgent;
    }
    makeStampable(requested) {
        if (!Array.isArray(requested))
            return requested;
        return requested.map((value) => this.itemAgent.makeStampable(value));
    }
    verifyStamp(requested) {
        if (!Array.isArray(requested))
            return false;
        return requested.every(v => this.itemAgent.verifyStamp(v));
    }
}
const arrayAgent = (itemAgent) => (new ArrayAgent(itemAgent));
exports.arrayAgent = arrayAgent;
class EnumAgent extends BaseAgent {
    constructor(enumObj) {
        super();
        this.enumObj = enumObj;
    }
    verifyStamp(requested) {
        const enumValues = Object.values(this.enumObj);
        return enumValues.includes(requested);
    }
}
const enumAgent = (enumObj) => (new EnumAgent(enumObj));
exports.enumAgent = enumAgent;
class ObjectAgent extends BaseAgent {
    constructor(objShape) {
        super();
        this.objShape = objShape;
    }
    makeStampable(requested) {
        if (typeof requested !== 'object' || requested === null)
            return false;
        return (0, lodash_1.mapValues)(requested, (value, key) => {
            if (this.objShape[key] === undefined)
                return value;
            return this.objShape[key].makeStampable(value);
        });
    }
    verifyStamp(requested) {
        if (typeof requested !== 'object' || requested === null)
            return false;
        return Object.entries(this.objShape).every(([property, agent]) => {
            if (!hasProperty(requested, property))
                return false;
            return agent.verifyStamp(requested[property]);
        });
    }
}
function objectAgent(shapeObj) {
    return new ObjectAgent(shapeObj);
}
/** */
/** Unsnake Agent *************************************************************/
/** */
class UnsnakeAgent extends BaseAgent {
    constructor(objAgent) {
        super();
        this.objAgent = objAgent;
    }
    verifyStamp(requested) {
        return this.objAgent.verifyStamp(requested);
    }
    makeStampable(requested) {
        if (typeof requested !== 'object' || requested === null)
            return requested;
        const unsnaked = (0, lodash_1.mapKeys)(requested, (_, key) => (0, lodash_1.camelCase)(key));
        return this.objAgent.makeStampable(unsnaked);
    }
}
const unsnakeAgent = (objAgent) => new UnsnakeAgent(objAgent);
exports.unsnakeAgent = unsnakeAgent;
/** */
/** Conversion Agent **********************************************************/
/** */
class ConversionAgent extends BaseAgent {
    constructor(inputAgent, converter, outputAgent) {
        super();
        this.inputAgent = inputAgent;
        this.converter = converter;
        this.outputAgent = outputAgent;
    }
    verifyStamp(requested) {
        return this.outputAgent.verifyStamp(requested);
    }
    makeStampable(requested) {
        if (!this.inputAgent.verifyStamp(requested))
            return requested;
        return this.converter(requested);
    }
    stamp(requested) {
        if (this.inputAgent.verifyStamp(requested)) {
            return this.converter(requested);
        }
        throw new Error(`${requested} cannot be stamped by agent ${this}`);
    }
}
function conversionAgent(inputAgent, converter, outputAgent) {
    return new ConversionAgent(inputAgent, converter, outputAgent);
}
