export const generateUUID = () => crypto.randomUUID();

export const cn = (...classes: (string | undefined | null | false)[]): string => {
    return classes
        .filter((cls): cls is string => Boolean(cls) && typeof cls === 'string')
        .join(' ')
        .trim();
};
