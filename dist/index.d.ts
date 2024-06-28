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
/** */
/** Base and Utility Function and Types ***************************************/
/** */
declare abstract class BaseAgent<T = unknown> {
    /**
     * An object of the type that this Agent inspects for and approves unioned
     * with undefined so we don't have to define an actual value for it. We only
     * care about the type.
     */
    defaultValue: T | undefined;
    /** A function that checks if the given value is a T. */
    abstract verifyStamp(requested: unknown): requested is T;
    /**
     * A function that checks if the given value can be made into a T with
     * makeStampable.
     */
    canStamp(requested: unknown): boolean;
    /**
     * If we need to make any modifications to requested before we can stamp it,
     * we do that here.
     */
    makeStampable(requested: unknown): unknown;
    /**
     * A function that takes some value we want to convert to `T`, verifies if the
     * conversion is valid, and returns the converted value if so. Otherwise, we
     * throw.
     */
    stamp(requested: unknown): T;
}
/**
 * Takes the given Agent and gives back the type of values that agent inspects
 * and approves. */
export type Stamped<T extends BaseAgent<unknown>> = Exclude<T['defaultValue'], undefined>;
export declare function hasProperty<P extends PropertyKey>(data: object, property: P): data is Record<P, unknown>;
export type Nullable<T> = {
    [Property in keyof T]: T[Property] | null;
};
/** */
/** Primitives ****************************************************************/
/** */
declare class StringAgent extends BaseAgent<string> {
    verifyStamp(requested: unknown): requested is string;
}
export declare const stringAgent: StringAgent;
declare class NumberAgent extends BaseAgent<number> {
    verifyStamp(requested: unknown): requested is number;
}
export declare const numberAgent: NumberAgent;
declare class BooleanAgent extends BaseAgent<boolean> {
    verifyStamp(requested: unknown): requested is boolean;
}
export declare const booleanAgent: BooleanAgent;
declare class NullAgent extends BaseAgent<null> {
    verifyStamp(requested: unknown): requested is null;
}
export declare const nullAgent: NullAgent;
/** */
/** Union Agent ***************************************************************/
/** */
declare class UnionAgent<U extends BaseAgent<Stamped<U>>, V extends BaseAgent<Stamped<V>>> extends BaseAgent<Stamped<U> | Stamped<V>> {
    directReports: {
        u: U;
        v: V;
    };
    constructor(uAgent: U, vAgent: V);
    makeStampable(requested: unknown): unknown;
    verifyStamp(requested: unknown): requested is Stamped<U> | Stamped<V>;
}
export declare function unionAgent<U extends BaseAgent<Stamped<U>>, V extends BaseAgent<Stamped<V>>>(leftType: U, rightType: V): UnionAgent<U, V>;
export declare function nullableAgent<T extends BaseAgent<Stamped<T>>>(otherAgent: T): UnionAgent<NullAgent, T>;
/** */
/** Array Agent ***************************************************************/
/** */
declare class ArrayAgent<T extends BaseAgent<Stamped<T>>> extends BaseAgent<Array<Stamped<T>>> {
    itemAgent: T;
    constructor(itemAgent: T);
    makeStampable(requested: unknown): unknown;
    verifyStamp(requested: unknown): requested is Array<Stamped<T>>;
}
export declare const arrayAgent: <T extends BaseAgent<Stamped<T>>>(itemAgent: T) => ArrayAgent<T>;
/** */
/** Enum Agent ****************************************************************/
/** */
type EnumValue<E> = E extends Record<string, infer V> ? Exclude<V, string> extends never ? V : Exclude<V, string> : never;
type Enum<E> = Record<keyof E, EnumValue<E>>;
declare class EnumAgent<E extends Enum<E>> extends BaseAgent<EnumValue<E>> {
    enumObj: E;
    constructor(enumObj: E);
    verifyStamp(requested: unknown): requested is EnumValue<E>;
}
export declare const enumAgent: <T extends Enum<T>>(enumObj: T) => EnumAgent<T>;
/** */
/** Object Agent **************************************************************/
/** */
type StampedObject<O extends Record<string, BaseAgent>> = {
    [Property in keyof O]: Stamped<O[Property]>;
};
declare class ObjectAgent<O extends Record<string, BaseAgent>> extends BaseAgent<StampedObject<O>> {
    objShape: O;
    constructor(objShape: O);
    makeStampable(requested: unknown): unknown;
    verifyStamp(requested: unknown): requested is StampedObject<O>;
}
export declare function objectAgent<O extends Record<string, BaseAgent>>(shapeObj: O): ObjectAgent<O>;
/** */
/** Unsnake Agent *************************************************************/
/** */
declare class UnsnakeAgent<O extends Record<string, BaseAgent>> extends BaseAgent<StampedObject<O>> {
    objAgent: ObjectAgent<O>;
    constructor(objAgent: ObjectAgent<O>);
    verifyStamp(requested: unknown): requested is StampedObject<O>;
    makeStampable(requested: unknown): unknown;
}
export declare const unsnakeAgent: <O extends Record<string, BaseAgent>>(objAgent: ObjectAgent<O>) => UnsnakeAgent<O>;
/** */
/** Conversion Agent **********************************************************/
/** */
declare class ConversionAgent<I extends BaseAgent<Stamped<I>>, O extends BaseAgent<Stamped<O>>> extends BaseAgent<Stamped<O>> {
    inputAgent: I;
    converter: (arg: Stamped<I>) => Stamped<O>;
    outputAgent: O;
    constructor(inputAgent: I, converter: (arg: Stamped<I>) => Stamped<O>, outputAgent: O);
    verifyStamp(requested: unknown): requested is Stamped<O>;
    makeStampable(requested: unknown): unknown;
    stamp(requested: unknown): Exclude<O["defaultValue"], undefined>;
}
export declare function conversionAgent<I extends BaseAgent<Stamped<I>>, O extends BaseAgent<Stamped<O>>>(inputAgent: I, converter: (arg: Stamped<I>) => Stamped<O>, outputAgent: O): ConversionAgent<I, O>;
export {};
