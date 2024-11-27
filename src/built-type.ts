export enum BuildType {
    None = 0,
    Series2 = 1 << 0,
    Series3 = 1 << 2,
    Series4 = 1 << 4,
    All = ~(~0 << 4)
}