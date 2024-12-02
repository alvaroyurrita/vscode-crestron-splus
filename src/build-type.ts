export enum BuildType {
    None = 0,
    Series2 = 1 << 0,
    Series3 = 1 << 1,
    Series4 = 1 << 2,
    All = ~(~0 << 3)
}