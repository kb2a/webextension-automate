export declare class Logger<DataType extends Record<string, Serializable>> {
    id: string;
    data: DataType;
    children: Logger<DataType>[];
    rootLogger: Logger<DataType> | undefined;
    parentLogger: Logger<DataType> | undefined;
    constructor(isRoot?: boolean);
    add(logData: DataType, parentId?: string): Logger<DataType>;
    remove(id: string): void;
    find(id: string): Logger<DataType> | undefined;
    update(id: string, logData: Partial<DataType>): void;
    clear(): void;
    toJSON(): DataType & {
        id: string;
        children: Array<GetLoggerJSONType<DataType>>;
    };
    importJSON(data: GetLoggerJSONType<DataType>): void;
}
export type GetLoggerJSONType<DataType extends Record<string, Serializable>> = ReturnType<Logger<DataType>['toJSON']>;
export type Serializable = string | number | boolean | undefined | Serializable[] | {
    [key: string]: Serializable;
};
//# sourceMappingURL=Logger.d.ts.map